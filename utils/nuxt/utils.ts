import fs from "fs";
import type { Ref, WatchOptions } from "vue";
import { AllKeys, allLocales, CommonItem, HeaderTabs, githubRepoUrl, HeaderTabUrl, getUniqueId, escapeNewLine } from "~/utils/common";
import { inBrowser, isDev, isPrerender } from "~/utils/nuxt";
import config from "~/config";

const timestamp = () => useRuntimeConfig().public.timestamp;

type returnType<T> = {
  data: {
    value: T
  },
  pending: Ref<boolean>
}

export const fetchList = <T extends CommonItem>(tab: HeaderTabUrl) => {
  if (isPrerender) {
    return {
      data: {
        value: JSON.parse(fs.readFileSync(`./public/rebuild/json${tab}.json`).toString()) as T[]
      },
      pending: ref(true)
    };
  }
  return fetchListManage<T>(tab);
};

export const fetchListManage = <T extends CommonItem>(tab: HeaderTabUrl) => {
  return useFetch<T[]>(`/rebuild/json${tab}.json?s=${timestamp()}`, {
    key: process.env.NODE_ENV + tab,
    default: () => []
  }) as returnType<T[]>;
};

export const fetchMd = (tab: HeaderTabUrl, id: string) => {
  if (isPrerender) {
    return {
      data: {
        value: escapeNewLine(fs.readFileSync(`./public/rebuild${tab}/${id}.md`).toString())
      },
      pending: ref(true)
    };
  }
  return fetchMdManage(tab, id);
};

export const fetchMdManage = (tab: HeaderTabUrl, id: string) => {
  return useFetch<string>(`/rebuild${tab}/${id}.md?s=${timestamp()}`, {
    key: process.env.NODE_ENV + `${tab}/${id}`,
    transform: (v: string) => escapeNewLine(v),
    default: () => ""
  });
};

export function useCurrentTab () {
  return HeaderTabs.find(tab => useUnlocalePath(useRoute().path).includes(tab.url))!;
}

export function useUnlocalePath (s?: string) {
  const path = typeof s === "undefined" ? useRoute().path : s;
  for (const locale of allLocales) {
    const prefix = "/" + locale;
    if (path.startsWith(prefix)) {
      return path.slice(prefix.length);
    }
  }
  return path;
}

/**
 * 计算rocket的url
 */
function calcRocketUrlSuffix (): boolean | string {
  const path = useUnlocalePath();
  const fromManage = path.startsWith("/manage");
  const paths = (fromManage ? path.replace(/^\/manage/, "") : path)
    .split("/")
    .slice(1);
  if (paths[0] === "about") {
    return false;
  }
  const item = HeaderTabs.find(tab => tab.url.substring(1) === paths[0]);
  if (item) {
    if (!paths[1] || paths[1] === "new") {
      return fromManage ? `/${paths[0]}` : `/manage/${paths[0]}/new`;
    }
    return (fromManage ? "" : "/manage") + `/${paths[0]}/${paths[1]}`;
  }
  return "/";
}
export function calcRocketUrl () {
  const url = calcRocketUrlSuffix();
  if (typeof url === "boolean") {
    return githubRepoUrl;
  }
  return useLocalePath()(url);
}

export function watchUntil (
  source: any,
  cb: (_: any, _old: any, _cleanup: any) => void,
  options: WatchOptions,
  until: ((_: any) => boolean) | "boolean" = () => true,
  type: "once" | "cancelAfterUntil" | "normalWhenUntil" = "normalWhenUntil"
) {
  let cancel: ReturnType<typeof watch> = () => undefined;
  const callback = (value: any, old: any, cleanup: any) => {
    const fit = until === "boolean" ? !!value : until(value);
    if (fit) {
      cb(value, old, cleanup);
    }
    switch (type) {
      case "once":
        cancel();
        break;
      case "cancelAfterUntil":
        if (fit) {
          cancel();
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
 * 展示评论
 */
const updateGiscusConfig = (config: object) => {
  const iframe = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
  if (!iframe) { return; }
  iframe.contentWindow!.postMessage({
    giscus: {
      setConfig: config
    }
  }, "https://giscus.app");
};
export function useComment (key: HeaderTabUrl) {
  const tab = key.substring(1);
  const { cmtRepCateId, cmtRepId } = useRuntimeConfig().app;
  const hasComment = (config.Comment as any)[tab] && cmtRepCateId && cmtRepId;
  const root = ref<HTMLElement>();
  onMounted(() => {
    if (hasComment) {
      if (cmtRepId && cmtRepCateId) {
        const { themeMode } = useThemeMode();
        const getTheme = () => {
          return themeMode.value === "light" ? "light" : "dark_dimmed";
        };
        const getLang = (locale: string) => {
          switch (locale) {
            case "en":
              return "en";
            default:
              return "zh-CN";
          }
        };

        const script = document.createElement("script");
        script.src = "https://giscus.app/client.js";
        script.setAttribute("data-repo", `${config.githubName}/${config.githubRepo}`);
        script.setAttribute("data-repo-id", cmtRepId);
        script.setAttribute("data-category", "Announcements");
        script.setAttribute("data-category-id", cmtRepCateId);
        script.setAttribute("data-mapping", "pathname");
        script.setAttribute("data-strict", "0");
        script.setAttribute("data-reactions-enabled", "1");
        script.setAttribute("data-emit-metadata", "0");
        script.setAttribute("data-input-position", "top");
        script.setAttribute("data-theme", getTheme());
        script.setAttribute("data-lang", getLang(useNuxtApp().$i18n.locale.value));
        script.setAttribute("crossorigin", "anonymous");
        script.setAttribute("async", "");
        root.value!.appendChild(script);
        watch(useNuxtApp().$i18n.locale, (locale) => {
          updateGiscusConfig({
            lang: getLang(locale)
          });
        });
        watch(themeMode, () => {
          updateGiscusConfig({
            theme: getTheme()
          });
        });
      }
    }
  });
  return { root, hasComment };
}

// XXX Must declare lifetime hook before using vue feature,like `render()` inside `notify()`.
/**
 * 注册onBeforeUnmounted加密取消监听
 */
export function registerCancelWatchEncryptor (): (() => void)[] {
  const cancelFnList: (() => void)[] = [];
  onBeforeUnmount(() => {
    cancelFnList.forEach(fn => fn());
  });
  return cancelFnList;
}

/**
 * 简化版deepClone
 */
export function deepClone<T extends object> (item: T): T {
  return JSON.parse(JSON.stringify(toRaw(item))) as T;
}

/**
 * 给item赋值, deepClone
 */
export function assignItem<T extends CommonItem> (dest: T, src: T) {
  for (const k of (Object.keys(src) as AllKeys[])) {
    // deepClone一下
    if (["tags"].includes(k)) {
      dest[k].splice(0, dest[k].length, ...deepClone(src[k]));
    } else if (k === "images") {
      // images需要特殊处理，设置id
      dest[k].splice(0, dest[k].length, ...src[k].map(img => ({
        ...img,
        id: getUniqueId()
      })));
    } else {
      dest[k] = src[k];
    }
  }
}

/**
 * localStorage 操作
 */
export function getLocalStorage<T extends string> (key: string): T | null {
  if (inBrowser) {
    const item = localStorage.getItem(key);
    return item as T;
  }
  return null;
}

export function setLocalStorage (key: string, value: string) {
  if (inBrowser) {
    localStorage.setItem(key, value);
  }
}

export function rmLocalStorage (key: string) {
  if (inBrowser) {
    localStorage.removeItem(key);
  }
}

/**
 * dev热更新
 */
export function devHotListen<T> (event: string, callback: (_: T) => unknown) {
  if (isDev) {
    const listener = (e: Event) => {
      callback((e as CustomEvent<T>).detail);
      window.removeEventListener(event, listener);
    };
    window.addEventListener(event, listener);
  }
}
