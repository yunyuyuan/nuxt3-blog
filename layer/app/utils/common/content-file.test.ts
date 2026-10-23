import { describe, expect, it } from "vitest";
import { parseItemFilePath, splitFrontmatter, stripFrontmatter } from "./content-body";
import { ContentFormatError, parseItemFile, serializeItemFile, sortIndex, toIndexItem } from "./content-file";
import type { ArticleItem, KnowledgeItem, RecordItem } from "./types";

const T1 = Date.UTC(2026, 8, 1, 12, 0, 0, 123);
const T2 = Date.UTC(2026, 9, 2, 8, 30, 0, 0);

describe("splitFrontmatter", () => {
  it("splits the frontmatter from the body", () => {
    expect(splitFrontmatter("---\na: 1\n---\n# body\n")).toEqual({ frontmatter: "a: 1\n", body: "# body\n" });
  });
  it("accepts CRLF line endings and an empty frontmatter", () => {
    expect(splitFrontmatter("---\r\n---\r\nbody")).toEqual({ frontmatter: "", body: "body" });
  });
  it("returns null when the file has no frontmatter", () => {
    expect(splitFrontmatter("# title\n---\n")).toEqual({ frontmatter: null, body: "# title\n---\n" });
    expect(stripFrontmatter("plain")).toBe("plain");
  });
  it("keeps a body that starts with a horizontal rule", () => {
    expect(stripFrontmatter("---\na: 1\n---\n---\ntext")).toBe("---\ntext");
  });
});

describe("parseItemFilePath", () => {
  it("parses item file paths and rejects other paths", () => {
    expect(parseItemFilePath("public/rebuild/articles/123.md")).toEqual({ tab: "/articles", id: 123 });
    expect(parseItemFilePath("public/rebuild/json/articles.json")).toBeNull();
    expect(parseItemFilePath("public/rebuild/other/1.md")).toBeNull();
  });
});

describe("serializeItemFile / parseItemFile", () => {
  const article: ArticleItem = {
    id: 42, title: "2024", tags: ["vue", "true"], len: 11, time: T1, modifyTime: T2,
    customSlug: "my-post", encrypt: false, showComments: true
  };
  const body = "---\nline one\r\nline two\n";

  it("writes the fields in a fixed order with ISO times", () => {
    const text = serializeItemFile("/articles", { ...article, _show: true } as ArticleItem, body);
    expect(text).toBe([
      "---",
      "title: \"2024\"",
      "tags:",
      "  - vue",
      "  - \"true\"",
      "time: 2026-09-01T12:00:00.123Z",
      "modifyTime: 2026-10-02T08:30:00.000Z",
      "customSlug: my-post",
      "encrypt: false",
      "showComments: true",
      "len: 11",
      "---",
      "---",
      "line one",
      "line two",
      ""
    ].join("\n"));
  });

  it("round-trips every item type", () => {
    const record: RecordItem = {
      id: 7, images: [{ src: "https://a/b.png", alt: "a: b" }], time: T1, modifyTime: T1,
      customSlug: "", encrypt: true, showComments: false
    };
    const knowledge: KnowledgeItem = {
      id: 9, title: "Book # 1", type: "film", link: "https://x", cover: "", summary: "line\n---\nline",
      time: T1, modifyTime: T2, customSlug: "", encrypt: false, showComments: false
    };
    for (const [tab, item] of [["/articles", article], ["/records", record], ["/knowledges", knowledge]] as const) {
      const parsed = parseItemFile(tab, item.id, serializeItemFile(tab, item, body));
      expect(parsed.item).toEqual(item);
      expect(parsed.body).toBe(body.replace(/\r\n/g, "\n"));
    }
  });

  it("does not write id, encryptBlocks or image ids", () => {
    const record = {
      id: 7, images: [{ src: "s", alt: "", id: 3 }], time: T1, modifyTime: T1,
      customSlug: "", encrypt: false, showComments: false, encryptBlocks: [{ start: 0, end: 1 }]
    } as RecordItem;
    const text = serializeItemFile("/records", record, "");
    expect(text).not.toMatch(/\bid:|encryptBlocks/);
  });

  it("fills defaults for a minimal hand-written file", () => {
    const { item } = parseItemFile("/articles", 5, "---\ntitle: Hello\ntime: 2026-09-01\n---\nabc");
    expect(item).toEqual({
      id: 5, title: "Hello", tags: [], len: 3, time: Date.UTC(2026, 8, 1), modifyTime: Date.UTC(2026, 8, 1),
      customSlug: "", encrypt: false, showComments: false
    });
    // 没有图片、未加密的 record：alternative 取正文前 50 个字符
    const long = "x".repeat(60);
    expect(parseItemFile("/records", 6, `---\ntime: ${T1}\n---\n${long}`).item.alternative).toBe("x".repeat(50));
    // 加密的 record 正文是密文，不推算 alternative
    expect(parseItemFile("/records", 6, `---\ntime: ${T1}\nencrypt: true\n---\nU2Fsd`).item.alternative).toBeUndefined();
  });

  it("reports the file and the field for invalid files", () => {
    const parse = (fm: string) => () => parseItemFile("/articles", 1, `---\n${fm}---\n`, "a.md");
    expect(() => parseItemFile("/articles", 1, "# no frontmatter", "a.md")).toThrow(ContentFormatError);
    expect(() => parseItemFile("/articles", 1, "# no frontmatter", "a.md")).toThrow(/^a\.md: missing frontmatter/);
    expect(parse("title: a\n")).toThrow("a.md: \"time\" is required");
    expect(parse("title: a\ntime: someday\n")).toThrow("\"time\" is not a valid time");
    expect(parse("title: a\ntime: 1\ntittle: b\n")).toThrow("unknown field(s): tittle");
    expect(parse("title: a\ntime: 1\nencrypt: yes\n")).toThrow("\"encrypt\" must be true or false");
    expect(parse("title: a\ntime: 1\ntags: vue\n")).toThrow("\"tags\" must be a list");
    expect(parse("title: [a\n")).toThrow("invalid YAML in frontmatter");
    expect(() => parseItemFile("/knowledges", 1, "---\ntitle: a\ntime: 1\ntype: music\n---\n", "k.md")).toThrow("\"type\" must be one of book, film, game");
    expect(() => parseItemFile("/records", 1, "---\ntime: 1\nimages:\n  - src: a\n    size: 1\n---\n", "r.md")).toThrow("\"images[0]\" has unknown field(s): size");
  });
});

describe("toIndexItem / sortIndex", () => {
  const base: Omit<ArticleItem, "id" | "time"> = { customSlug: "", modifyTime: 0, encrypt: false, showComments: false, title: "", tags: [], len: 0 };
  it("marks items that contain encrypted blocks", () => {
    const body = "a\n[encrypt]\nU2FsdGVkX1abc\n[/encrypt]\nb";
    expect(toIndexItem({ ...base, id: 1, time: 1 }, body).encryptBlocks).toHaveLength(1);
    expect(toIndexItem({ ...base, id: 1, time: 1 }, "plain").encryptBlocks).toBeUndefined();
    // 整篇加密时正文是密文，不标记加密块
    expect(toIndexItem({ ...base, id: 1, time: 1, encrypt: true }, body).encryptBlocks).toBeUndefined();
  });
  it("sorts by creation time, newest first, then by id", () => {
    const list = [{ ...base, id: 1, time: 1 }, { ...base, id: 2, time: 3 }, { ...base, id: 3, time: 1 }];
    expect(sortIndex(list).map(i => i.id)).toEqual([2, 3, 1]);
  });
});
