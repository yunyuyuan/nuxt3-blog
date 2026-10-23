import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { ArticleItem } from "../common/types";
import { fetchAny, fetchList, fetchMd, invalidateHeadCache, isReadingFromHead, setHeadReader, setHeadReadingActive, type HeadDirEntry } from "./fetch";

registerEndpoint("/rebuild/json/records.json", () => [{ id: 1, title: "static" }]);

afterEach(() => {
  setHeadReader(undefined);
  setHeadReadingActive(false);
});

const articleFile = (id: number, title: string, time: number, body = "body") =>
  `---\ntitle: ${title}\ntime: ${time}\nlen: ${body.length}\n---\n${body}`;

function makeReader(dirs: Record<string, HeadDirEntry[]>, files: Record<string, string> = {}) {
  return {
    file: vi.fn(async (p: string) => {
      if (p in files) {
        return files[p]!;
      }
      throw Object.assign(new Error(`GitHub API 404: ${p}`), { status: 404 });
    }),
    dir: vi.fn(async (d: string) => dirs[d] ?? [])
  };
}

describe("reading from HEAD", () => {
  it("reads deployed static files unless the reader is set and the manage layout is active", async () => {
    setHeadReader(makeReader({}));
    expect(isReadingFromHead()).toBe(false);
    const list = await fetchList<ArticleItem>("/records");
    expect(list[0]!.title).toBe("static");
  });

  it("builds the list from the item files of the directory, like the build-time index", async () => {
    const reader = makeReader({
      "public/rebuild/articles": [
        { name: "1.md", text: articleFile(1, "old", 100) },
        { name: "2.md", text: articleFile(2, "new", 200, "a\n[encrypt]\nU2FsdGVkX1abc\n[/encrypt]\nb") },
        // 不是条目文件：忽略
        { name: "notes.txt", text: "x" }
      ]
    });
    setHeadReader(reader);
    setHeadReadingActive(true);
    expect(isReadingFromHead()).toBe(true);

    const a = await fetchList<ArticleItem>("/articles");
    expect(reader.dir).toHaveBeenCalledWith("public/rebuild/articles");
    // 按创建时间倒序；补齐默认字段；计算加密块
    expect(a.map(i => i.id)).toEqual([2, 1]);
    expect(a[1]).toMatchObject({ id: 1, title: "old", tags: [], customSlug: "", encrypt: false, modifyTime: 100 });
    expect(a[0]!.encryptBlocks).toHaveLength(1);
    expect(a[1]!.encryptBlocks).toBeUndefined();

    // 缓存原文，每次返回新对象
    const b = await fetchList<ArticleItem>("/articles");
    expect(reader.dir).toHaveBeenCalledTimes(1);
    expect(a).not.toBe(b);
    expect(b).toEqual(a);
  });

  it("reads the body from the directory cache and strips the frontmatter", async () => {
    const reader = makeReader({ "public/rebuild/articles": [{ name: "2.md", text: articleFile(2, "t", 1, "hello") }] }, {
      "public/rebuild/articles/3.md": articleFile(3, "t", 1, "single"),
      "config.ts": "export default {}"
    });
    setHeadReader(reader);
    setHeadReadingActive(true);

    // 目录还没读过：单独读取文件
    expect(await fetchMd("/articles", "3")).toBe("single");
    expect(reader.file).toHaveBeenLastCalledWith("public/rebuild/articles/3.md");

    // 列表读过目录以后，正文直接从目录中取，不再请求
    await fetchList("/articles");
    expect(await fetchMd("/articles", "2")).toBe("hello");
    expect(reader.file).toHaveBeenCalledTimes(1);

    // fetchAny 返回原文，包含 frontmatter（diff 对比整个文件）
    expect(await fetchAny("public/rebuild/articles/2.md")).toBe(articleFile(2, "t", 1, "hello"));
    expect(await fetchAny("config.ts")).toBe("export default {}");
    expect(reader.file).toHaveBeenLastCalledWith("config.ts");
  });

  it("invalidates the committed files and their directories", async () => {
    const dirs = { "public/rebuild/articles": [{ name: "1.md", text: articleFile(1, "before", 1) }] };
    const reader = makeReader(dirs);
    setHeadReader(reader);
    setHeadReadingActive(true);
    expect((await fetchList<ArticleItem>("/articles"))[0]!.title).toBe("before");

    dirs["public/rebuild/articles"] = [{ name: "1.md", text: articleFile(1, "after", 1) }];
    // 其他目录的提交不影响这个目录
    invalidateHeadCache(["public/rebuild/records/5.md"]);
    expect((await fetchList<ArticleItem>("/articles"))[0]!.title).toBe("before");

    invalidateHeadCache(["public/rebuild/articles/1.md"]);
    expect((await fetchList<ArticleItem>("/articles"))[0]!.title).toBe("after");
    expect(reader.dir).toHaveBeenCalledTimes(2);
  });

  it("does not cache a failed read", async () => {
    let fail = true;
    const reader = makeReader({});
    reader.file.mockImplementation(async () => {
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
    expect(reader.file).toHaveBeenCalledTimes(2);
  });

  it("rejects a malformed item file instead of showing a partial list", async () => {
    setHeadReader(makeReader({ "public/rebuild/articles": [{ name: "1.md", text: "---\ntitle: [\n---\nbody" }] }));
    setHeadReadingActive(true);
    await expect(fetchList("/articles")).rejects.toThrow("public/rebuild/articles/1.md");
  });
});
