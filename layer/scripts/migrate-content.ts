// 一次性迁移：旧格式（json/{栏目}.json 索引 + {栏目}/{id}.md 正文）
// -> 新格式（{栏目}/{id}.md = YAML frontmatter + 正文，索引在构建时生成）。
// 先在内存中生成全部新文件并读回核对，全部一致后才写入磁盘；可以重复运行。
import fs from "fs";
import path from "path";
import { isDeepStrictEqual } from "util";
import { parseItemFile, serializeItemFile } from "../app/utils/common/content-file";
import { HeaderTabs } from "../app/utils/common/tabs";
import type { HeaderTabUrl } from "../app/utils/common/tabs";
import type { ArticleItem, CommonItem, RecordItem } from "../app/utils/common/types";

export type MigrationPlan = {
  rebuildDir: string;
  /** 要写入的条目文件 */
  writes: { file: string; text: string }[];
  /** 迁移后删除的旧索引 */
  indexFiles: string[];
  /** 已经是新格式的文件数 */
  alreadyMigrated: number;
  /** 不在旧索引中、也不是新格式的 md 文件：旧站点不显示它们 */
  orphans: string[];
  /** 旧索引中有、但没有 md 文件的条目：按空正文迁移 */
  missingBodies: string[];
  counts: Record<HeaderTabUrl, number>;
};

/** 旧索引条目在新格式中应得到的存储字段（与 parseItemFile 的默认值规则相同） */
function expectedItem(tab: HeaderTabUrl, old: CommonItem, body: string): CommonItem {
  const item: CommonItem = { ...old };
  delete item.encryptBlocks;
  item.customSlug ||= "";
  item.modifyTime ||= item.time;
  item.encrypt = Boolean(item.encrypt);
  item.showComments = Boolean(item.showComments);
  if (tab === "/articles") {
    const a = item as ArticleItem;
    a.tags = (a.tags ?? []).map(String);
    if (typeof a.len !== "number") {
      a.len = body.length;
    }
  } else if (tab === "/records") {
    const r = item as RecordItem;
    r.images = (r.images ?? []).map(img => ({ src: img.src, alt: img.alt ?? "" }));
    if (!r.alternative) {
      delete r.alternative;
      if (!r.images.length && !r.encrypt) {
        r.alternative = body.slice(0, 50);
      }
    }
  }
  return item;
}

function rel(file: string) {
  return path.relative(process.cwd(), file);
}

/**
 * 生成迁移计划，不修改任何文件。
 * @throws Error 读回核对不一致时
 */
export function planMigration(rebuildDir: string): MigrationPlan {
  const plan: MigrationPlan = {
    rebuildDir, writes: [], indexFiles: [], alreadyMigrated: 0, orphans: [], missingBodies: [],
    counts: { "/articles": 0, "/records": 0, "/knowledges": 0 }
  };
  for (const tab of HeaderTabs) {
    const name = tab.slice(1);
    const indexFile = path.join(rebuildDir, "json", `${name}.json`);
    const dir = path.join(rebuildDir, name);
    const mdFiles = fs.existsSync(dir) ? fs.readdirSync(dir).filter(f => /^\d+\.md$/.test(f)) : [];
    if (!fs.existsSync(indexFile)) {
      // 没有旧索引：这个栏目已经迁移过，或者没有内容
      plan.alreadyMigrated += mdFiles.length;
      continue;
    }
    const list = JSON.parse(fs.readFileSync(indexFile, "utf-8")) as CommonItem[];
    const listed = new Set(list.map(item => `${item.id}.md`));
    for (const f of mdFiles.filter(f => !listed.has(f))) {
      const file = path.join(dir, f);
      // 新格式的文件不算孤儿：索引可能是上次构建生成的，之后新增的条目不在其中
      try {
        parseItemFile(tab, Number(f.slice(0, -3)), fs.readFileSync(file, "utf-8"), rel(file));
        plan.alreadyMigrated += 1;
      } catch {
        plan.orphans.push(file);
      }
    }
    for (const old of list) {
      const file = path.join(dir, `${old.id}.md`);
      let raw = "";
      if (fs.existsSync(file)) {
        raw = fs.readFileSync(file, "utf-8");
      } else {
        plan.missingBodies.push(file);
      }
      // 已经是新格式：能解析，且字段与旧索引一致（构建时生成的索引也满足这个条件）
      try {
        const parsed = parseItemFile(tab, old.id, raw, rel(file));
        if (isDeepStrictEqual(parsed.item, expectedItem(tab, old, parsed.body))) {
          plan.alreadyMigrated += 1;
          continue;
        }
      } catch {
        // 旧格式：整个文件都是正文
      }
      const body = raw.replace(/\r\n/g, "\n");
      const text = serializeItemFile(tab, old, raw);
      const back = parseItemFile(tab, old.id, text, rel(file));
      const expected = expectedItem(tab, old, body);
      if (!isDeepStrictEqual(back.item, expected) || back.body !== body) {
        throw new Error(`${rel(file)}: the converted file does not read back the same.\n`
          + `expected: ${JSON.stringify(expected)}\nread back: ${JSON.stringify(back.item)}`
          + (back.body !== body ? "\n(the content differs)" : ""));
      }
      plan.writes.push({ file, text });
      plan.counts[tab] += 1;
    }
    plan.indexFiles.push(indexFile);
  }
  return plan;
}

/** 按计划写入新文件、删除旧索引；deleteOrphans 为 true 时同时删除不在旧索引中的 md 文件 */
export function applyMigration(plan: MigrationPlan, { deleteOrphans }: { deleteOrphans: boolean }) {
  if (plan.orphans.length && !deleteOrphans) {
    throw new Error("Files that are not in the old index must be deleted before the migration:\n"
      + plan.orphans.map(f => "  " + rel(f)).join("\n"));
  }
  for (const { file, text } of plan.writes) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, text);
  }
  for (const file of [...plan.indexFiles, ...plan.orphans]) {
    fs.rmSync(file, { force: true });
  }
}
