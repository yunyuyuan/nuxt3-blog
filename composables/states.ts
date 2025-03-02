import { useState } from "#app";

import config from "~/config";
import { GithubTokenKey, I18nStoreKey, ThemeModeKey } from "~/utils/common/constants";
import type { I18nCode } from "~/utils/common/locales";
import { toggleCodeBlockTheme } from "~/utils/common/utils";
import { loadI18nJson } from "~/utils/nuxt/i18n";
import { getLocalStorage, setLocalStorage } from "~/utils/nuxt/localStorage";

// avoid loading during SSG
export const useFirstLoad = () => useState("first-loaded", () => true);

export const useIsMobile = () => useState("is-mobile", () => false);

export const useGithubToken = () => useState(GithubTokenKey, () => "");
export const useIsAuthor = () => useState<null | boolean>("is-author", () => null);
export const useCorrectSha = () => useState("correct-sha", () => "");
export const useUnsavedContent = () => useState("unsaved-content", () => false);
export const useThemeMode = () => {
  const themeMode = useState<"light" | "dark" | "">(ThemeModeKey, () => "");
  // 首次加载的时候，不进行动画
  const shouldAnimate = useState(`${ThemeModeKey}-animate`, () => false);

  const toggleThemeMode = () => {
    shouldAnimate.value = true;
    document.documentElement.classList.remove(`${themeMode.value}-mode`);
    themeMode.value = themeMode.value === "light" ? "dark" : "light";
    document.documentElement.classList.add(`${themeMode.value}-mode`);
    setLocalStorage(ThemeModeKey, themeMode.value);
    toggleCodeBlockTheme(themeMode.value);
  };

  onMounted(() => {
    themeMode.value = getLocalStorage(ThemeModeKey) || "light";
  });
  return {
    themeMode,
    shouldAnimate,
    toggleThemeMode
  };
};

export const useI18nCode = () => {
  const i18nCode = useState<I18nCode>(I18nStoreKey, () => config.defaultLang as any);
  i18nCode.value = getLocalStorage(I18nStoreKey) || config.defaultLang as any;
  return {
    i18nCode,
    changeI18n: async (code: I18nCode) => {
      await loadI18nJson(code);
      i18nCode.value = code;
      setLocalStorage(I18nStoreKey, code);
    }
  };
};
