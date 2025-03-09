import { escapeNewLine } from "../common/utils";
import type { CommonItem, HeaderTabUrl } from "~/utils/common/types";
import { inBrowser, isDev, isPrerender } from "~/utils/nuxt/constants";

const magicFetch = async<T = any>(_path: string, transform: (_: string) => T): Promise<T | undefined> => {
  const path = __NB_VITESTING__ ? `e2e/${_path}` : _path;
  if (inBrowser) {
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
};

export const fetchList = async<T extends CommonItem>(tab: HeaderTabUrl) => {
  return await magicFetch<T[]>(`rebuild/json${tab}.json`, JSON.parse) || [];
};

export const fetchMd = async (tab: HeaderTabUrl, id: string) => {
  return await magicFetch<string>(`rebuild${tab}/${id}.md`, escapeNewLine) || "";
};

declare global {
  interface Window {
    NBCache: Record<string, any>;
  }
}
