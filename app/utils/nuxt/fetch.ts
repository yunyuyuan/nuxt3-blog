import { escapeNewLine } from "../common/utils";
import type { CommonItem, HeaderTabUrl } from "~/utils/common/types";
import { isDev, isPrerender } from "~/utils/nuxt/constants";
import { withBase } from "~/utils/nuxt/with-base";

// 读的是静态文件，不需要 Nitro 的路由类型。直接调用带类型的 $fetch，在新增带方法后缀的 API 路由后
// 会让类型推导栈深度超限；所以先转成简单的函数类型。仍用 $fetch 而不是原生 fetch：
// 单元测试的 registerEndpoint 只拦截 $fetch，$fetch 也会对非 2xx 状态抛错。
type StaticFetch = <T>(url: string, opts: { query: Record<string, string>; parseResponse: (_: string) => T }) => Promise<T>;
const staticFetch = $fetch as unknown as StaticFetch;

/** 读取仓库中某个文件的原文，参数是相对仓库根目录的路径 */
export type HeadReader = (repoPath: string) => Promise<string>;

// 后台从仓库 HEAD 读取内容，不再读已部署的静态文件，所以提交后不必等部署。
// headReader 由 GitHub 实现在 token 验证通过后注册；headReadingActive 只在后台布局挂载期间为 true。
// 公开页面始终读已部署的静态文件。
let headReader: HeadReader | undefined;
let headReadingActive = false;
// 缓存原文（Promise），每次读取时再 transform，调用方拿到的是新对象
const headCache = new Map<string, Promise<string>>();

export function setHeadReader(reader: HeadReader | undefined) {
  headReader = reader;
  headCache.clear();
}

export function setHeadReadingActive(active: boolean) {
  headReadingActive = active;
}

export function isReadingFromHead() {
  return import.meta.client && headReadingActive && !!headReader;
}

/** 提交成功后调用：这些文件下次从新的 HEAD 读取 */
export function invalidateHeadCache(repoPaths: string[]) {
  repoPaths.forEach(p => headCache.delete(p));
}

function readFromHead(repoPath: string) {
  let text = headCache.get(repoPath);
  if (!text) {
    text = headReader!(repoPath);
    headCache.set(repoPath, text);
    // 失败的读取不缓存；错误仍由调用方处理
    text.catch(() => headCache.delete(repoPath));
  }
  return text;
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

export const fetchList = async<T extends CommonItem>(tab: HeaderTabUrl) => {
  return await magicFetch<T[]>(`public/rebuild/json${tab}.json`, s => (JSON.parse(s) as T[]).map(item => ({ ...item, customSlug: item.customSlug || "" })));
};

export const fetchMd = async (tab: HeaderTabUrl, id: string) => {
  return await magicFetch<string>(`public/rebuild${tab}/${id}.md`, escapeNewLine) || "";
};

/** @param path 相对仓库根目录的路径（与提交时的 path 相同） */
export const fetchAny = async<T = any>(path: string) => {
  return await magicFetch<T>(path, path.endsWith(".json") ? JSON.parse : escapeNewLine);
};

declare global {
  interface Window {
    NBCache: Record<string, any>;
  }
}
