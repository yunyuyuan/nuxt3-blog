import fs from "fs";
import os from "os";
import path from "path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { parseItemFile } from "../app/utils/common/content-file";
import { applyMigration, planMigration } from "./migrate-content";

let dir: string;

function write(rel: string, text: string) {
  const file = path.join(dir, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, text);
}
const read = (rel: string) => fs.readFileSync(path.join(dir, rel), "utf-8");
const exists = (rel: string) => fs.existsSync(path.join(dir, rel));

// 旧格式：JSON 索引 + 只有正文的 md
function writeOldFormat() {
  write("json/articles.json", JSON.stringify([
    { id: 2, title: "Second", tags: ["a", 1], time: 2000, modifyTime: 2500, len: 4, encrypt: false, showComments: true, customSlug: "second" },
    { id: 1, title: "First", tags: [], time: 1000, modifyTime: 0, len: 99, encrypt: false, showComments: false, encryptBlocks: [{ start: 0, end: 1 }] }
  ]));
  write("articles/2.md", "body\r\nline 2");
  write("articles/1.md", "---\nnot: frontmatter\n---\nold body that starts with a horizontal rule");
  write("json/records.json", JSON.stringify([
    { id: 5, images: [], time: 5000, modifyTime: 5000, encrypt: false, showComments: false },
    { id: 6, images: [{ src: "s", alt: "a", id: 123 }], alternative: "", time: 6000, modifyTime: 6000, encrypt: false, showComments: false }
  ]));
  write("records/5.md", "a record without images and without alternative text");
  write("records/6.md", "with image");
  write("json/knowledges.json", "[]");
}

beforeEach(() => {
  dir = fs.mkdtempSync(path.join(os.tmpdir(), "nb-migrate-"));
});
afterEach(() => {
  fs.rmSync(dir, { recursive: true, force: true });
});

describe("planMigration / applyMigration", () => {
  it("converts every indexed item and removes the old index", () => {
    writeOldFormat();
    const plan = planMigration(dir);
    expect(plan.counts).toEqual({ "/articles": 2, "/records": 2, "/knowledges": 0 });
    expect(plan.orphans).toEqual([]);
    applyMigration(plan, { deleteOrphans: false });

    expect(exists("json/articles.json")).toBe(false);
    expect(exists("json/records.json")).toBe(false);
    expect(exists("json/knowledges.json")).toBe(false);

    const second = parseItemFile("/articles", 2, read("articles/2.md"));
    expect(second.body).toBe("body\nline 2");
    expect(second.item).toEqual({
      id: 2, title: "Second", tags: ["a", "1"], time: 2000, modifyTime: 2500, len: 4,
      encrypt: false, showComments: true, customSlug: "second"
    });

    // 旧正文本身以 --- 开头：保留在正文中，不被当作 frontmatter
    const first = parseItemFile("/articles", 1, read("articles/1.md"));
    expect(first.body).toBe("---\nnot: frontmatter\n---\nold body that starts with a horizontal rule");
    expect(first.item.len).toBe(99);
    expect(first.item.modifyTime).toBe(1000);
    expect(read("articles/1.md")).not.toContain("encryptBlocks");

    // 无图、无 alternative 的 record：按正文推算；图片的界面 id 不写入
    expect(parseItemFile("/records", 5, read("records/5.md")).item.alternative)
      .toBe("a record without images and without alternative text".slice(0, 50));
    const withImage = parseItemFile("/records", 6, read("records/6.md")).item;
    expect(withImage.images).toEqual([{ src: "s", alt: "a" }]);
    expect(withImage.alternative).toBeUndefined();
  });

  it("can run again without changing converted files", () => {
    writeOldFormat();
    applyMigration(planMigration(dir), { deleteOrphans: false });
    const before = read("articles/2.md");

    const again = planMigration(dir);
    expect(again.writes).toEqual([]);
    expect(again.alreadyMigrated).toBe(4);

    // 构建时生成的索引存在、而且已经过期（缺少 1 号条目）时，也识别为已迁移，不把 1 号当作孤儿
    write("json/articles.json", JSON.stringify([
      { id: 2, title: "Second", tags: ["a", "1"], time: 2000, modifyTime: 2500, len: 4, encrypt: false, showComments: true, customSlug: "second" }
    ]));
    const withIndex = planMigration(dir);
    expect(withIndex.writes).toEqual([]);
    expect(withIndex.orphans).toEqual([]);
    expect(withIndex.alreadyMigrated).toBe(4);
    applyMigration(withIndex, { deleteOrphans: false });
    expect(read("articles/2.md")).toBe(before);
  });

  it("requires confirmation before deleting md files that are not in the index", () => {
    writeOldFormat();
    write("articles/7.md", "not listed");
    const plan = planMigration(dir);
    expect(plan.orphans.map(f => path.basename(f))).toEqual(["7.md"]);

    expect(() => applyMigration(plan, { deleteOrphans: false })).toThrow(/not in the old index/);
    // 报错时不修改任何文件
    expect(exists("json/articles.json")).toBe(true);
    expect(read("articles/2.md")).toBe("body\r\nline 2");

    applyMigration(plan, { deleteOrphans: true });
    expect(exists("articles/7.md")).toBe(false);
    expect(parseItemFile("/articles", 2, read("articles/2.md")).item.title).toBe("Second");
  });

  it("converts an indexed item without md file with empty content", () => {
    write("json/articles.json", JSON.stringify([
      { id: 3, title: "No body", tags: [], time: 1, modifyTime: 1, len: 0, encrypt: false, showComments: false }
    ]));
    const plan = planMigration(dir);
    expect(plan.missingBodies.map(f => path.basename(f))).toEqual(["3.md"]);
    applyMigration(plan, { deleteOrphans: false });
    expect(parseItemFile("/articles", 3, read("articles/3.md")).body).toBe("");
  });

  it("stops before writing when a converted file does not read back the same", () => {
    // type 不在允许的值中：解析时报错，迁移在写入之前停止
    write("json/knowledges.json", JSON.stringify([
      { id: 4, title: "t", type: "podcast", link: "", cover: "", summary: "", time: 1, modifyTime: 1, encrypt: false, showComments: false }
    ]));
    write("knowledges/4.md", "body");
    expect(() => planMigration(dir)).toThrow(/"type" must be one of/);
    expect(read("knowledges/4.md")).toBe("body");
  });
});
