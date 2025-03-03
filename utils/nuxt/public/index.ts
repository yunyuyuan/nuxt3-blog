import axios from "axios";
import config from "~/config";
import { cmtRepId, cmtRepCateId, isPrerender, inBrowser } from "~/utils/nuxt/constants";

export function DBOperate<T = any> (
  { apiPath, query, callback }:
  { apiPath: string, query: any, callback: (_: T) => any}
) {
  if (inBrowser && !isPrerender && __NB_MONGODB_ENABLED__) {
    const cb = (data: T) => {
      try {
        callback(data);
      } catch { }
    };

    axios.post(`/api${apiPath}`, query).then(res => cb(res.data));
  }
}

/**
 * 展示评论
 */
export function useComment(hasComment: boolean) {
  const root = ref<HTMLElement>();
  const updateGiscusConfig = (config: object) => {
    const iframe = document.querySelector<HTMLIFrameElement>("iframe.giscus-frame");
    if (!iframe) {
      return;
    }
    iframe.contentWindow!.postMessage({
      giscus: {
        setConfig: config
      }
    }, "https://giscus.app");
  };

  if (__NB_COMMENTING_ENABLED__) {
    onMounted(() => {
      if (hasComment && root.value) {
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
        script.setAttribute("data-repo-id", cmtRepId!);
        script.setAttribute("data-category", "Announcements");
        script.setAttribute("data-category-id", cmtRepCateId!);
        script.setAttribute("data-mapping", "pathname");
        script.setAttribute("data-strict", "0");
        script.setAttribute("data-reactions-enabled", "1");
        script.setAttribute("data-emit-metadata", "0");
        script.setAttribute("data-input-position", "top");
        script.setAttribute("data-theme", getTheme());
        script.setAttribute("data-lang", getLang(useI18nCode().i18nCode.value));
        script.setAttribute("crossorigin", "anonymous");
        script.setAttribute("async", "");
        root.value.appendChild(script);
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
    });
  }
  return { root, hasComment };
}