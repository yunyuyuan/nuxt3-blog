import fs from "fs";
import { AllKeys, CommonItem, HeaderTabs, HeaderTabUrl, NeedsItem } from "./types";
import { githubRepoUrl, inBrowser, isPrerender } from "./constants";
import config from "~/config";

const timestamp = () => useRuntimeConfig().public.timestamp;

export const fetchList = (tab: HeaderTabUrl) => {
  if (isPrerender) {
    return {
      data: {
        value: JSON.parse(fs.readFileSync(`./public/rebuild/json${tab}.json`).toString())
      },
      pending: ref(true)
    };
  }
  return fetchListManage(tab);
};

export const fetchListManage = (tab: HeaderTabUrl) => {
  return useFetch<CommonItem[]>(`/rebuild/json${tab}.json?s=${timestamp()}`, {
    key: process.env.NODE_ENV + tab,
    default: () => []
  });
};

export const fetchMd = (tab: HeaderTabUrl, id: string) => {
  if (isPrerender) {
    return {
      data: {
        value: fs.readFileSync(`./public/rebuild${tab}/${id}.md`).toString()
      },
      pending: ref(true)
    };
  }
  return fetchMdManage(tab, id);
};

export const fetchMdManage = (tab: HeaderTabUrl, id: string) => {
  return useFetch<string>(`/rebuild${tab}/${id}.md?s=${timestamp()}`, {
    key: process.env.NODE_ENV + `${tab}/${id}`,
    default: () => ""
  });
};

/**
 * 计算rocket的url
 */
export function calcRocketUrl () {
  const path = useRoute().path;
  const fromManage = path.startsWith("/manage");
  const paths = (fromManage ? path.replace(/^\/manage/, "") : path)
    .split("/")
    .slice(1);
  if (paths[0] === "about") {
    return githubRepoUrl;
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

/**
 * localStorage 操作
 */
export function getLocalStorage (key: string): string {
  if (inBrowser) {
    return localStorage.getItem(key);
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
 * 生成唯一id
 */
let uniqueId = 0;
export function getUniqueId (): typeof uniqueId {
  return uniqueId++;
}

/**
 * 展示评论
 */
export function useComment (key: HeaderTabUrl) {
  const tab = key.substring(1);
  const hasComment = config.Comment[tab];
  const root = ref<HTMLElement>();
  onMounted(() => {
    if (hasComment) {
      const script = document.createElement("script");
      script.src = "https://giscus.app/client.js";
      script.setAttribute("data-repo", `${config.githubName}/${config.githubRepo}`);
      script.setAttribute("data-repo-id", config.CommentRepoId);
      script.setAttribute("data-category", "Announcements");
      script.setAttribute("data-category-id", config.CommentDiscussionCategoryId);
      script.setAttribute("data-mapping", "pathname");
      script.setAttribute("data-strict", "0");
      script.setAttribute("data-reactions-enabled", "1");
      script.setAttribute("data-emit-metadata", "0");
      script.setAttribute("data-input-position", "top");
      script.setAttribute("data-theme", "preferred_color_scheme");
      script.setAttribute("data-lang", "zh-CN");
      script.setAttribute("crossorigin", "anonymous");
      script.setAttribute("async", "");
      root.value.appendChild(script);
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
 * 创建一个新item
 */
export function createNewItem (url: HeaderTabUrl): CommonItem {
  const baseInfo: NeedsItem = {
    id: 0,
    time: 0,
    modifyTime: 0,
    encrypt: false
  };
  switch (url) {
    case "/articles":
      return {
        title: "",
        menu: [],
        len: 0,
        tags: [],
        ...baseInfo
      };
    case "/records":
      return {
        images: [],
        ...baseInfo
      };
    case "/knowledges":
      return {
        title: "",
        summary: "",
        link: "",
        cover: "",
        type: "book",
        ...baseInfo
      };
  }
}

/**
 * 简化版deepClone
 */
export function deepClone<T extends object> (item: T): T {
  return JSON.parse(JSON.stringify(item)) as T;
}

/**
 * 给item赋值
 */
export function assignItem (dest: CommonItem, src: CommonItem) {
  for (const k of (Object.keys(src) as AllKeys[])) {
    // deepClone一下
    if (["menu", "tags"].includes(k)) {
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
