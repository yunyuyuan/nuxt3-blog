import type { WatchOptions } from "vue";
import { type AllKeys, type CommonItem, HeaderTabs, githubRepoUrl, type HeaderTabUrl, getUniqueId } from "~/utils/common";
import { inBrowser, isDev } from "~/utils/nuxt";
import config from "~/config";

// XXX 在mount时更新一下key，防止SSG里v-for产生的元素，在client里被vue忽略
export const useHackKey = () => {
  const key = ref(1);
  onMounted(() => {
    key.value += 1;
  });
  return key;
};

export function useCurrentTab () {
  return HeaderTabs.find(tab => useRoute().path.includes(tab.url)) || HeaderTabs[0];
}

export function useCommonSEOTitle (head: ComputedRef<string>, keys?: ComputedRef<string[]>) {
  watch([head, keys], ([head, keys]) => {
    const title = head + config.SEO_title;
    useHead({
      title,
      meta: [{
        name: "description",
        content: title
      }, {
        name: "keywords",
        content: computed(() => `${head}${keys?.length ? ("," + keys?.join(",")) : ""},${config.SEO_keywords}`)
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
function calcRocketUrlSuffix (): boolean | string {
  const path = useRoute().path.substring(1) || "articles";
  const fromManage = path.startsWith("manage");
  const paths = (fromManage ? path.replace(/^manage\//, "") : path).split("/");
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
  return url;
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
        script.setAttribute("data-lang", getLang(useI18nCode().i18nCode.value));
        script.setAttribute("crossorigin", "anonymous");
        script.setAttribute("async", "");
        root.value!.appendChild(script);
        watch(useI18nCode().i18nCode, (locale) => {
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
  if (isDev && inBrowser) {
    const listener = (e: Event) => {
      callback((e as CustomEvent<T>).detail);
      window.removeEventListener(event, listener);
    };
    window.addEventListener(event, listener);
  }
}
