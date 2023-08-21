import { GithubTokenKey, I18nCode, I18nStoreKey, toggleCodeBlockTheme } from "~/utils/common";
import { useState } from "#app";

import { getLocalStorage, loadI18nJson, setLocalStorage } from "~/utils/nuxt";
import config from "~/config";
const ThemeModeKey = "theme-mode";

// avoid loading during SSG
export const useFirstLoad = () => useState("first-loaded", () => true);

export const useIsMobile = () => useState("is-mobile", () => false);

export const useGithubToken = () => useState(GithubTokenKey, () => "");
export const useIsAuthor = () => useState<null | boolean>("is-author", () => null);
export const useCorrectSha = () => useState("correct-sha", () => "");
export const useUnsavedContent = () => useState("unsaved-content", () => false);
export const useThemeMode = () => {
  const themeMode = useState<"light" | "dark">(ThemeModeKey, () => "light");
  themeMode.value = getLocalStorage(ThemeModeKey) || "light";
  return {
    themeMode,
    toggleThemeMode: () => {
      document.documentElement.classList.remove(`${themeMode.value}-mode`);
      themeMode.value = themeMode.value === "light" ? "dark" : "light";
      document.documentElement.classList.add(`${themeMode.value}-mode`);
      setLocalStorage(ThemeModeKey, themeMode.value);
      toggleCodeBlockTheme(themeMode.value);
    }
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
