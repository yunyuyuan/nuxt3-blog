import path from "path";
import { describe, expect, it } from "vitest";
import { resolveWritablePath } from "./allowed-path";

const root = "/repo";

describe("resolveWritablePath", () => {
  it("allows files in public/rebuild and config.ts", () => {
    expect(resolveWritablePath(root, "public/rebuild/json/articles.json")).toBe(path.resolve(root, "public/rebuild/json/articles.json"));
    expect(resolveWritablePath(root, "public/rebuild/articles/123.md")).toBe(path.resolve(root, "public/rebuild/articles/123.md"));
    expect(resolveWritablePath(root, "config.ts")).toBe(path.resolve(root, "config.ts"));
  });

  it("rejects paths outside the allowed locations", () => {
    for (const p of [
      "package.json",
      "nuxt.config.ts",
      "public/rebuild",
      "public/rebuild-other/a.md",
      "public/rebuild/../../package.json",
      "../outside.txt",
      "/etc/passwd",
      "app/config.ts"
    ]) {
      expect(() => resolveWritablePath(root, p), p).toThrow(/Refusing to write/);
    }
  });
});
