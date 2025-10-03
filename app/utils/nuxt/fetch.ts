import { escapeNewLine } from "../common/utils";
import type { CommonItem, HeaderTabUrl } from "~/utils/common/types";
import { isDev, isPrerender } from "~/utils/nuxt/constants";

const magicFetch = async<T = any>(_path: string, transform: (_: string) => T): Promise<T> => {
  const path = __NB_BUILDTIME_VITESTING__ ? `e2e/${_path}` : _path;
  if (import.meta.client) {
    if (!window.NBCache) {
      window.NBCache = {};
    }
    if (typeof window.NBCache[path] !== "undefined") {
      return window.NBCache[path];
    } else {
      const res = await $fetch<T>(`/${path}`, { query: { s: __NB_BUILD_TIME__ }, parseResponse: transform });
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
