import { useState } from "#app";
import { GithubTokenKey } from "~/utils/constants";
import { getLocalStorage, setLocalStorage } from "~/utils/utils";

export const useFirstLoad = () => useState("first-loaded", () => true);
export const useGithubToken = () => useState(GithubTokenKey, () => "");
export const useCorrectSha = () => useState("correct-sha", () => "");
export const useUnsavedContent = () => useState("unsaved-content", () => false);
export const useThemeMode = () => {
  const ThemeModeKey = "theme-mode";
  const isFirst = ref(true);
  const themeMode = useState("theme-mode", () => getLocalStorage<"light" | "dark">(ThemeModeKey, "light"));
  return {
    themeMode,
    toggleThemeMode: () => {
      document.documentElement.classList.remove(`${themeMode.value}-mode`);
      themeMode.value = themeMode.value === "light" ? "dark" : "light";
      document.documentElement.classList.add(`${themeMode.value}-mode`);
      setLocalStorage(ThemeModeKey, themeMode.value);
      if (isFirst) {
        isFirst.value = false;
      }
    },
    isFirst
  };
};
