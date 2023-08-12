import fs from "fs";
import { CommonItem, HeaderTabUrl, escapeNewLine } from "~/utils/common";
import { inBrowser, isPrerender } from "~/utils/nuxt";

const timestamp = () => useRuntimeConfig().public.timestamp;
const cacheData: Record<string, any> = {};

const fetchWithCache = <T = any>(filepath: string, defaultFn: () => T, transform = (v: string) => v) => {
  const data = ref<T>(cacheData[filepath] || defaultFn());
  const pending = ref(true);
  if (inBrowser) {
    if (cacheData[filepath]) {
      pending.value = false;
    } else {
      $fetch(`/${filepath}?s=${timestamp()}`).then((res) => {
        res = transform(res);
        data.value = res as any;
        cacheData[filepath] = res;
      }).finally(() => {
        pending.value = false;
      });
    }
  }
  return { data, pending };
};

const fetchInPrerender = <T = any>(filepath: string, transform = (v: string) => v) => {
  return {
    data: ref<T>(transform(fs.readFileSync(`./public/${filepath}`).toString()) as T),
    pending: ref(true)
  };
};

export const fetchList = <T extends CommonItem>(tab: HeaderTabUrl) => {
  const filepath = `rebuild/json${tab}.json`;
  if (isPrerender) {
    return fetchInPrerender<T[]>(filepath, JSON.parse);
  }
  return fetchWithCache<T[]>(filepath, () => []);
};

export const fetchMd = (tab: HeaderTabUrl, id: string) => {
  const filepath = `rebuild${tab}/${id}.md`;
  if (isPrerender) {
    return fetchInPrerender<string>(filepath, escapeNewLine);
  }
  return fetchWithCache<string>(filepath, () => "", escapeNewLine);
};
