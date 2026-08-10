import type { WatchHandle, WatchOptions } from "vue";
import { HeaderTabs } from "../common/types";
import { isDev } from "./constants";
import config from "~~/config";

export function getCurrentTab() {
  return HeaderTabs.find(tab => useRoute().path.includes(tab)) || HeaderTabs[0];
}

/**
 * 列表项渐入动画的交错延迟：延迟期间元素不可见（fade-in-up 的 fill 模式），
 * 若延迟随 index 线性增长，用户把滚动条直接拖到底部会长时间看到空白，
 * 因此把延迟统一封顶在 480ms，与动画时长 0.5s（见 tailwind.config.mjs）相当。
 * index 必须是可见项的序号，v-show 隐藏的项不能占用序号
 */
export function staggerDelay(index: number) {
  return `${Math.min(index * 60, 480)}ms`;
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
