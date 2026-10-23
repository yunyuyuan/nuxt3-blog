import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ArticleItem } from "../common/types";
import { fetchAny, fetchList, fetchMd, invalidateHeadCache, isReadingFromHead, setHeadReader, setHeadReadingActive } from "./fetch";

registerEndpoint("/rebuild/json/records.json", () => [{ id: 1, title: "static" }]);

afterEach(() => {
  setHeadReader(undefined);
  setHeadReadingActive(false);
});

describe("reading from HEAD", () => {
  it("reads deployed static files unless the reader is set and the manage layout is active", async () => {
    setHeadReader(async () => "[]");
    expect(isReadingFromHead()).toBe(false);
    const list = await fetchList<ArticleItem>("/records");
    expect(list[0]!.title).toBe("static");
  });

  it("passes repo paths to the reader, caches the text and returns new objects", async () => {
    const reader = vi.fn(async (p: string) => p.endsWith(".json") ? JSON.stringify([{ id: 2, title: "head" }]) : "content");
    setHeadReader(reader);
    setHeadReadingActive(true);
    expect(isReadingFromHead()).toBe(true);

    const a = await fetchList("/articles");
    const b = await fetchList("/articles");
    expect(reader).toHaveBeenCalledTimes(1);
    expect(reader).toHaveBeenCalledWith("public/rebuild/json/articles.json");
    expect(a[0]).toEqual({ id: 2, title: "head", customSlug: "" });
    expect(a).not.toBe(b);

    await fetchMd("/articles", "2");
    expect(reader).toHaveBeenLastCalledWith("public/rebuild/articles/2.md");
    await fetchAny("config.ts");
    expect(reader).toHaveBeenLastCalledWith("config.ts");

    invalidateHeadCache(["public/rebuild/json/articles.json"]);
    await fetchList("/articles");
    expect(reader.mock.calls.filter(c => c[0] === "public/rebuild/json/articles.json")).toHaveLength(2);
  });

  it("does not cache a failed read", async () => {
    let fail = true;
    const reader = vi.fn(async () => {
      if (fail) {
        throw Object.assign(new Error("GitHub API 404"), { status: 404 });
      }
      return "ok";
    });
    setHeadReader(reader);
    setHeadReadingActive(true);
    await expect(fetchMd("/articles", "9")).rejects.toThrow("404");
    fail = false;
    expect(await fetchMd("/articles", "9")).toBe("ok");
    expect(reader).toHaveBeenCalledTimes(2);
  });
});
