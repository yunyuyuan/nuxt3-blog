import { escapeNewLine } from "../common/utils";
import type { CommonItem, HeaderTabUrl } from "~/utils/common/types";
import { isDev, isPrerender } from "~/utils/nuxt/constants";
import { withBase } from "~/utils/nuxt/with-base";

// 读的是静态文件，不需要 Nitro 的路由类型。直接调用带类型的 $fetch，在新增带方法后缀的 API 路由后
// 会让类型推导栈深度超限；所以先转成简单的函数类型。仍用 $fetch 而不是原生 fetch：
// 单元测试的 registerEndpoint 只拦截 $fetch，$fetch 也会对非 2xx 状态抛错。
type StaticFetch = <T>(url: string, opts: { query: Record<string, string>; parseResponse: (_: string) => T }) => Promise<T>;
const staticFetch = $fetch as unknown as StaticFetch;

const magicFetch = async<T = any>(_path: string, transform: (_: string) => T): Promise<T> => {
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
  return await magicFetch<T[]>(`rebuild/json${tab}.json`, s => (JSON.parse(s) as T[]).map(item => ({ ...item, customSlug: item.customSlug || "" })));
};

export const fetchMd = async (tab: HeaderTabUrl, id: string) => {
  return await magicFetch<string>(`rebuild${tab}/${id}.md`, escapeNewLine) || "";
};

export const fetchAny = async<T = any>(path: string) => {
  return await magicFetch<T>(path.replace("public/", ""), path.endsWith(".json") ? JSON.parse : escapeNewLine);
};

declare global {
  interface Window {
    NBCache: Record<string, any>;
  }
}
