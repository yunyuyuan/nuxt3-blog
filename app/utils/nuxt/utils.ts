import type { WatchHandle, WatchOptions } from "vue";
import { HeaderTabs } from "../common/types";
import { isDev } from "./constants";
import config from "~~/config";

export function getCurrentTab() {
  return HeaderTabs.find(tab => useRoute().path.includes(tab)) || HeaderTabs[0];
}

export function useCommonSEOTitle(head: ComputedRef<string>, keys?: ComputedRef<string[]>) {
  watch([head, keys].filter(i => !!i), ([head, keys]) => {
    const title = head + config.SEO_title;
    useHead({
      title,
      meta: [{
        name: "description",
        content: title
      }, {
        name: "keywords",
        content: computed(() => `${head}${(Array.isArray(keys) && keys.length) ? ("," + keys?.join(",")) : ""},${config.SEO_keywords}`)
      }]
    });
    useSeoMeta({
      ogTitle: title,
      ogDescription: title
    });
  }, { immediate: true });
}

/**
 * 计算rocket的url
 */
export function calcRocketUrl() {
  const path = useRoute().path.substring(1) || "articles";
  const fromManage = path.startsWith("manage");
  const paths = (fromManage ? path.replace(/^manage\//, "") : path).split("/");
  if (paths[0] === "about") {
    return `https://github.com/${config.githubName}/${__NB_GITHUB_REPO__}`;
  }
  const item = HeaderTabs.find(tab => tab.substring(1) === paths[0]);
  if (item) {
    if (!paths[1] || paths[1] === "0") {
      return fromManage ? `/${paths[0]}` : `/manage/${paths[0]}`;
    }
    return (fromManage ? "" : "/manage") + `/${paths[0]}/${paths[1]}`;
  }
  return "/";
}

export function watchUntil(
  source: any,
  cb: (value: any, oldValue: any, cleanup: any) => void,
  options: WatchOptions,
  until: ((value: any) => boolean) | "boolean" = () => true,
  type: "once" | "cancelAfterUntil" | "normalWhenUntil" = "normalWhenUntil"
) {
  // eslint-disable-next-line prefer-const
  let cancel: WatchHandle;
  const callback = (value: any, old: any, cleanup: any) => {
    const fit = until === "boolean" ? !!value : until(value);
    if (fit) {
      cb(value, old, cleanup);
    }
    switch (type) {
      case "once":
        cancel?.();
        break;
      case "cancelAfterUntil":
        if (fit) {
          cancel?.();
        }
        break;
      case "normalWhenUntil":
        break;
    }
  };
  cancel = watch(source, callback, options);
  return cancel;
}

/**
 * 简化版deepClone
 */
export function deepClone<T extends object>(item: T): T {
  return JSON.parse(JSON.stringify(toRaw(item))) as T;
}

/**
 * dev热更新
 */
export function devHotListen<T>(event: string, callback: (_: T) => unknown) {
  if (isDev && import.meta.client) {
    const listener = (e: Event) => {
      callback((e as CustomEvent<T>).detail);
      window.removeEventListener(event, listener);
    };
    window.addEventListener(event, listener);
  }
}
