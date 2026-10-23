import { itemDirPath, itemFilePath, parseItemFilePath, stripFrontmatter } from "../common/content-body";
import { escapeNewLine } from "../common/utils";
import type { CommonItem, HeaderTabUrl } from "#layers/nuxt-blog/app/utils/common/types";
import { isDev, isPrerender } from "#layers/nuxt-blog/app/utils/nuxt/constants";
import { withBase } from "#layers/nuxt-blog/app/utils/nuxt/with-base";

// 读的是静态文件，不需要 Nitro 的路由类型。直接调用带类型的 $fetch，在新增带方法后缀的 API 路由后
// 会让类型推导栈深度超限；所以先转成简单的函数类型。仍用 $fetch 而不是原生 fetch：
// 单元测试的 registerEndpoint 只拦截 $fetch，$fetch 也会对非 2xx 状态抛错。
type StaticFetch = <T>(url: string, opts: { query: Record<string, string>; parseResponse: (_: string) => T }) => Promise<T>;
const staticFetch = $fetch as unknown as StaticFetch;

export type HeadDirEntry = { name: string; text: string };
/** 从仓库读取内容。参数都是相对仓库根目录的路径 */
export type HeadReader = {
  /** 读取一个文件的原文 */
  file: (repoPath: string) => Promise<string>;
  /** 读取一个目录中的全部文件（不递归）；目录不存在时返回空数组 */
  dir: (repoDir: string) => Promise<HeadDirEntry[]>;
};

// 后台从仓库 HEAD 读取内容，不再读已部署的静态文件，所以提交后不必等部署。
// headReader 由 GitHub 实现在 token 验证通过后注册；headReadingActive 只在后台布局挂载期间为 true。
// 公开页面始终读已部署的静态文件。
let headReader: HeadReader | undefined;
let headReadingActive = false;
// 缓存原文（Promise），每次读取时再 transform，调用方拿到的是新对象
const headCache = new Map<string, Promise<string>>();
const headDirCache = new Map<string, Promise<HeadDirEntry[]>>();

export function setHeadReader(reader: HeadReader | undefined) {
  headReader = reader;
  headCache.clear();
  headDirCache.clear();
}

export function setHeadReadingActive(active: boolean) {
  headReadingActive = active;
}

export function isReadingFromHead() {
  return import.meta.client && headReadingActive && !!headReader;
}

const parentDir = (repoPath: string) => repoPath.slice(0, repoPath.lastIndexOf("/"));

/** 提交成功后调用：这些文件和它们所在的目录，下次从新的 HEAD 读取 */
export function invalidateHeadCache(repoPaths: string[]) {
  repoPaths.forEach((p) => {
    headCache.delete(p);
    headDirCache.delete(parentDir(p));
  });
}

function cached<T>(cache: Map<string, Promise<T>>, key: string, load: () => Promise<T>) {
  let value = cache.get(key);
  if (!value) {
    value = load();
    cache.set(key, value);
    // 失败的读取不缓存；错误仍由调用方处理
    value.catch(() => cache.delete(key));
  }
  return value;
}

function readDirFromHead(repoDir: string) {
  return cached(headDirCache, repoDir, () => headReader!.dir(repoDir));
}

function readFromHead(repoPath: string) {
  return cached(headCache, repoPath, async () => {
    // 列表已经读过这个目录时，直接用目录中的原文，不再单独请求
    const dir = headDirCache.get(parentDir(repoPath));
    if (dir) {
      const name = repoPath.slice(repoPath.lastIndexOf("/") + 1);
      const entry = await dir.then(entries => entries.find(e => e.name === name), () => undefined);
      if (entry) {
        return entry.text;
      }
    }
    return headReader!.file(repoPath);
  });
}

/**
 * @param repoPath 相对仓库根目录的路径，如 public/rebuild/json/articles.json、config.ts。
 * 读静态文件时去掉 public/ 前缀。
 */
const magicFetch = async<T = any>(repoPath: string, transform: (_: string) => T): Promise<T> => {
  if (isReadingFromHead()) {
    return transform(await readFromHead(repoPath));
  }
  const _path = repoPath.replace(/^public\//, "");
  const path = __NB_BUILDTIME_VITESTING__ ? `e2e/${_path}` : _path;
  if (import.meta.client) {
    if (!window.NBCache) {
      window.NBCache = {};
    }
    if (typeof window.NBCache[path] !== "undefined") {
      return window.NBCache[path];
    } else {
      const res = await staticFetch(withBase(`/${path}`), { query: { s: __NB_BUILD_TIME__ }, parseResponse: transform });
      window.NBCache[path] = res;
      return res;
    }
  } else if (isDev || isPrerender) {
    return transform((await import("fs")).readFileSync("public/" + path, { encoding: "utf-8" }).toString());
  }
  return transform("[]");
};

/** 从仓库目录中的条目文件生成列表，与构建时生成的索引相同（layer/scripts/utils/content.ts） */
async function fetchListFromHead<T extends CommonItem>(tab: HeaderTabUrl): Promise<T[]> {
  const dir = itemDirPath(tab);
  // 解析 frontmatter 要用 yaml，只在后台需要，所以按需加载
  const [entries, { parseItemFile, sortIndex, toIndexItem }] = await Promise.all([
    readDirFromHead(dir),
    import("../common/content-file")
  ]);
  const list = entries.flatMap(({ name, text }) => {
    const file = `${dir}/${name}`;
    const parsed = parseItemFilePath(file);
    if (!parsed) {
      return [];
    }
    const { item, body } = parseItemFile(tab, parsed.id, text, file);
    return [toIndexItem(item, body) as unknown as T];
  });
  return sortIndex(list);
}

export const fetchList = async<T extends CommonItem>(tab: HeaderTabUrl) => {
  if (isReadingFromHead()) {
    return await fetchListFromHead<T>(tab);
  }
  // 索引在构建时生成（public/rebuild/json/），字段已经补齐
  return await magicFetch<T[]>(`public/rebuild/json${tab}.json`, s => JSON.parse(s) as T[]);
};

/** 条目的正文（不含 frontmatter） */
export const fetchMd = async (tab: HeaderTabUrl, id: string) => {
  return await magicFetch<string>(itemFilePath(tab, id), s => stripFrontmatter(s)) || "";
};

/**
 * 读取仓库中的文件原文（条目文件包含 frontmatter）。
 * @param path 相对仓库根目录的路径（与提交时的 path 相同）
 */
export const fetchAny = async<T = any>(path: string) => {
  return await magicFetch<T>(path, path.endsWith(".json") ? JSON.parse : escapeNewLine);
};

declare global {
  interface Window {
    NBCache: Record<string, any>;
  }
}
