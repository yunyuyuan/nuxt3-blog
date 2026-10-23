// 条目文件的格式：YAML frontmatter（元数据）+ 正文。
// 文件路径是 public/rebuild/{栏目}/{id}.md，id 取自文件名，不写入 frontmatter。
// 后台、构建模块、scripts 和 e2e 共用这个模块，保证读写的字段和顺序一致。
import { parse as parseYaml, stringify as stringifyYaml } from "yaml";
import { itemFilePath, splitFrontmatter } from "./content-body";
import { findEncryptBlocks } from "./process-encrypt-decrypt";
import { KnowledgeTabs } from "./tabs";
import type { HeaderTabUrl } from "./tabs";
import type { ArticleItem, CommonItem, CommonItemByHeaderType, KnowledgeItem, RecordItem } from "./types";

export class ContentFormatError extends Error {
  constructor(public file: string, detail: string) {
    super(`${file}: ${detail}`);
    this.name = "ContentFormatError";
  }
}

// 每个栏目允许的 frontmatter 字段，也是写入时的顺序
const COMMON_TAIL = ["time", "modifyTime", "customSlug", "encrypt", "showComments"] as const;
const FIELDS: Record<HeaderTabUrl, readonly string[]> = {
  "/articles": ["title", "tags", ...COMMON_TAIL, "len"],
  "/records": ["images", "alternative", ...COMMON_TAIL],
  "/knowledges": ["title", "type", "link", "cover", "summary", ...COMMON_TAIL]
};

type Data = Record<string, unknown>;

/** 读取时间：接受毫秒时间戳或日期字符串（如 2026-09-01T12:00:00.000Z、2026-09-01） */
function readTime(data: Data, key: string, fail: (_: string) => never): number | undefined {
  const v = data[key];
  if (v === undefined || v === null) {
    return undefined;
  }
  const ms = typeof v === "number" ? v : typeof v === "string" ? Date.parse(v) : v instanceof Date ? v.getTime() : Number.NaN;
  if (!Number.isFinite(ms)) {
    fail(`"${key}" is not a valid time: ${JSON.stringify(v)}`);
  }
  return ms;
}

function readString(data: Data, key: string, fail: (_: string) => never, fallback?: string): string {
  const v = data[key];
  if (v === undefined || v === null) {
    if (fallback === undefined) {
      fail(`"${key}" is required`);
    }
    return fallback;
  }
  // YAML 会把 2024、true 这样的值解析成数字或布尔值；对字符串字段，把它们转回字符串
  if (typeof v === "string" || typeof v === "number" || typeof v === "boolean") {
    return String(v);
  }
  return fail(`"${key}" must be a string`);
}

function readBoolean(data: Data, key: string, fail: (_: string) => never, fallback: boolean): boolean {
  const v = data[key];
  if (v === undefined || v === null) {
    return fallback;
  }
  if (typeof v !== "boolean") {
    fail(`"${key}" must be true or false`);
  }
  return v;
}

function readList<T>(data: Data, key: string, fail: (_: string) => never, readItem: (_: unknown, index: number) => T): T[] {
  const v = data[key];
  if (v === undefined || v === null) {
    return [];
  }
  if (!Array.isArray(v)) {
    fail(`"${key}" must be a list`);
  }
  return v.map(readItem);
}

/**
 * 解析条目文件，并按栏目校验字段。
 * 缺少的可选字段使用与新建条目相同的默认值；len、alternative 缺失时从正文推算。
 * @throws ContentFormatError 格式错误时，消息中包含文件路径和字段名
 */
export function parseItemFile<T extends HeaderTabUrl>(
  tab: T,
  id: number,
  raw: string,
  file = itemFilePath(tab, id)
): { item: CommonItemByHeaderType<T>; body: string } {
  const fail = (detail: string): never => {
    throw new ContentFormatError(file, detail);
  };
  const { frontmatter, body } = splitFrontmatter(raw);
  if (frontmatter === null) {
    fail("missing frontmatter (the file must start with a line \"---\")");
  }
  let data: unknown;
  try {
    data = parseYaml(frontmatter!) ?? {};
  } catch (e) {
    fail(`invalid YAML in frontmatter: ${(e as Error).message}`);
  }
  if (typeof data !== "object" || Array.isArray(data)) {
    fail("frontmatter must be a mapping of fields");
  }
  const d = data as Data;
  const allowed = FIELDS[tab];
  const unknown = Object.keys(d).filter(k => !allowed.includes(k));
  if (unknown.length) {
    fail(`unknown field(s): ${unknown.join(", ")}. Allowed: ${allowed.join(", ")}`);
  }

  const time = readTime(d, "time", fail);
  if (time === undefined) {
    fail("\"time\" is required");
  }
  const encrypt = readBoolean(d, "encrypt", fail, false);
  const base = {
    id,
    customSlug: readString(d, "customSlug", fail, ""),
    time: time!,
    modifyTime: readTime(d, "modifyTime", fail) ?? time!,
    encrypt,
    showComments: readBoolean(d, "showComments", fail, false)
  };

  let item: CommonItem;
  if (tab === "/articles") {
    const len = d.len;
    if (len !== undefined && len !== null && (typeof len !== "number" || !Number.isFinite(len))) {
      fail("\"len\" must be a number");
    }
    item = {
      title: readString(d, "title", fail),
      tags: readList(d, "tags", fail, (t, i) => {
        if (typeof t !== "string" && typeof t !== "number") {
          fail(`"tags[${i}]" must be a string`);
        }
        return String(t);
      }),
      len: typeof len === "number" ? len : body.length,
      ...base
    } satisfies ArticleItem;
  } else if (tab === "/records") {
    const images = readList(d, "images", fail, (img, i) => {
      if (typeof img !== "object" || img === null || Array.isArray(img)) {
        fail(`"images[${i}]" must be a mapping with "src" and "alt"`);
      }
      const extra = Object.keys(img as Data).filter(k => k !== "src" && k !== "alt");
      if (extra.length) {
        fail(`"images[${i}]" has unknown field(s): ${extra.join(", ")}`);
      }
      return {
        src: readString(img as Data, "src", m => fail(`images[${i}]: ${m}`)),
        alt: readString(img as Data, "alt", m => fail(`images[${i}]: ${m}`), "")
      };
    });
    const record: RecordItem = { images, ...base };
    const alternative = readString(d, "alternative", fail, "");
    if (alternative) {
      record.alternative = alternative;
    } else if (!images.length && !encrypt) {
      record.alternative = body.slice(0, 50);
    }
    item = record;
  } else {
    const type = readString(d, "type", fail, "book");
    if (!(KnowledgeTabs as readonly string[]).includes(type)) {
      fail(`"type" must be one of ${KnowledgeTabs.join(", ")}`);
    }
    item = {
      title: readString(d, "title", fail),
      type: type as KnowledgeItem["type"],
      link: readString(d, "link", fail, ""),
      cover: readString(d, "cover", fail, ""),
      summary: readString(d, "summary", fail, ""),
      ...base
    } satisfies KnowledgeItem;
  }
  return { item: item as CommonItemByHeaderType<T>, body };
}

const toIso = (ms: number) => new Date(ms).toISOString();

/**
 * 生成条目文件的内容。只写入存储字段：不写 id（在文件名中）、encryptBlocks（从正文计算）
 * 和以 _ 开头的界面字段。字段顺序固定，便于比较 diff。
 */
export function serializeItemFile(tab: HeaderTabUrl, item: CommonItem, body: string): string {
  const data: Data = {};
  if (tab === "/articles") {
    const a = item as ArticleItem;
    data.title = a.title;
    data.tags = [...a.tags];
  } else if (tab === "/records") {
    const r = item as RecordItem;
    data.images = r.images.map(img => ({ src: img.src, alt: img.alt }));
    if (r.alternative) {
      data.alternative = r.alternative;
    }
  } else {
    const k = item as KnowledgeItem;
    data.title = k.title;
    data.type = k.type;
    data.link = k.link;
    data.cover = k.cover;
    data.summary = k.summary;
  }
  data.time = toIso(item.time);
  data.modifyTime = toIso(item.modifyTime || item.time);
  if (item.customSlug) {
    data.customSlug = item.customSlug;
  }
  data.encrypt = Boolean(item.encrypt);
  data.showComments = Boolean(item.showComments);
  if (tab === "/articles") {
    data.len = (item as ArticleItem).len;
  }
  // lineWidth: 0 不折行，长字符串（例如密文）保持在一行
  const yamlText = stringifyYaml(data, { lineWidth: 0 });
  return `---\n${yamlText}---\n${body.replace(/\r\n/g, "\n")}`;
}

/**
 * 索引（/rebuild/json/{栏目}.json）中的条目：存储字段 + 计算字段。
 * encryptBlocks 只表示“有加密块”；位置在使用时从正文解析。
 */
export function toIndexItem<T extends CommonItem>(item: T, body: string): T {
  const indexItem: T = { ...item };
  delete indexItem.encryptBlocks;
  if (!item.encrypt) {
    const blocks = findEncryptBlocks(body);
    if (blocks.length) {
      indexItem.encryptBlocks = blocks;
    }
  }
  return indexItem;
}

/** 索引的顺序：创建时间倒序，相同时 id 倒序 */
export function sortIndex<T extends CommonItem>(list: T[]): T[] {
  return list.sort((a, b) => b.time - a.time || b.id - a.id);
}
