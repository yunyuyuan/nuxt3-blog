import { Calendar, Eye, FileText } from "lucide-vue-next";
import type { CommonItem } from "../../common/types";
import { formatTime } from "../format-time";
import { watchUntil } from "../utils";
import { cmtRepCateId, cmtRepId } from "../constants";
import config from "~/config";
import { translate } from "~/utils/nuxt/i18n";

export function Visitors(props: { visitors?: number }) {
  return (
    __NB_MONGODB_ENABLED__ && Number(props.visitors) >= 0
      ? (
          <span class="flex items-center gap-1" title={translate("visit-time", [props.visitors])}>
            <Eye class="size-4" />
            { props.visitors }
          </span>
        )
      : null
  );
}

export function Words(props: { len: number }) {
  return (
    Number(props.len) >= 0
      ? (
          <span class="flex items-center gap-1">
            <FileText class="size-4" />
            { props.len }
            {" "}
            { translate("words-num") }
          </span>
        )
      : null
  );
}

export function WroteDate(props: { item: CommonItem }) {
  return (
    <span class="flex items-center gap-1" title={`${translate("created-at")}: ${formatTime(props.item.time)}\n${translate("updated-at")}: ${formatTime(props.item.modifyTime)}`}>
      <Calendar class="size-4" />
      { formatTime(props.item.time, "date") }
    </span>
  );
}

export function Comments() {
  if (!__NB_COMMENTING_ENABLED__) return null;

  const { themeMode } = useThemeMode();

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

  const onGetHTMLElement = (el?: HTMLElement) => {
    if (!el) return;
    watchUntil(themeMode, () => {
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
      el.appendChild(script);
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
    }, { immediate: true }, themeMode => !!themeMode, "cancelAfterUntil");
  };

  return (
    <section>
      <h3 class="mb-4 text-xl font-medium text-dark-900 dark:text-white">
        { translate("comments") }
      </h3>
      <div class="flex min-h-44 items-center justify-center rounded-lg border border-dark-200 p-4 dark:border-dark-700 dark:bg-dark-800">
        <div
          ref={el => onGetHTMLElement(el as HTMLElement)}
          class="w-full"
        />
      </div>
    </section>
  );
}
