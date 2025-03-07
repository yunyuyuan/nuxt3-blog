import { useState } from "#app";

import config from "~/config";
import { GithubTokenKey, I18nStoreKey, ThemeModeKey } from "~/utils/common/constants";
import type { I18nCode } from "~/utils/common/locales";
import { loadI18nJson } from "~/utils/nuxt/i18n";
import { setLocalStorage } from "~/utils/nuxt/localStorage";

// avoid loading during SSG
export const useFirstLoad = () => useState("first-loaded", () => true);

export const useGithubToken = () => useState(GithubTokenKey, () => "");
export const useIsAuthor = () => useState<null | boolean>("is-author", () => null);
export const useRemoteLatestSha = () => useState("remote-latest-sha", () => "");
export const useUnsavedContent = () => useState("unsaved-content", () => false);
export const useThemeMode = () => {
  const themeMode = useState<"light" | "dark" | "">(ThemeModeKey, () => "");

  const toggleThemeMode = () => {
    document.documentElement.classList.remove(themeMode.value);
    themeMode.value = themeMode.value === "light" ? "dark" : "light";
    document.documentElement.classList.add(themeMode.value);
    setLocalStorage(ThemeModeKey, themeMode.value);
  };
  return {
    themeMode,
    toggleThemeMode
  };
};

export const useI18nCode = () => {
  const i18nCode = useState<I18nCode>(I18nStoreKey, () => config.defaultLang as any);

  return {
    i18nCode,
    changeI18n: async (code: I18nCode) => {
      await loadI18nJson(code);
      i18nCode.value = code;
      setLocalStorage(I18nStoreKey, code);
    }
  };
};
