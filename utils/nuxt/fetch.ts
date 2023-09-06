import fs from "fs";
import { CommonItem, HeaderTabUrl, escapeNewLine } from "~/utils/common";
import { inBrowser } from "~/utils/nuxt";

const timestamp = () => useRuntimeConfig().public.timestamp;

const magicFetch = async<T = any>(path: string, transform: (_: string) => T): Promise<T> => {
  if (inBrowser) {
    if (!window.NBCache) {
      window.NBCache = {};
    }
    if (typeof window.NBCache[path] !== "undefined") {
      return window.NBCache[path];
    } else {
      const res = await $fetch<T>(`/${path}`, { query: { s: timestamp() }, parseResponse: transform });
      window.NBCache[path] = res;
      return res;
    }
  } else {
    return transform(fs.readFileSync("public/" + path, { encoding: "utf-8" }).toString());
  }
};

export const fetchList = <T extends CommonItem>(tab: HeaderTabUrl): Promise<T[]> => {
  return magicFetch<T[]>(`rebuild/json${tab}.json`, JSON.parse);
};

export const fetchMd = (tab: HeaderTabUrl, id: string): Promise<string> => {
  return magicFetch<string>(`rebuild${tab}/${id}.md`, escapeNewLine);
};

declare global {
  // eslint-disable-next-line no-unused-vars
  interface Window {
    NBCache: Record<string, any>;
  }
}
