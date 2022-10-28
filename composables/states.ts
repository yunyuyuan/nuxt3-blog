import { useState } from "#app";
import { GithubTokenKey } from "~/utils/constants";
import { getLocalStorage, setLocalStorage } from "~/utils/utils";
const ThemeModeKey = "theme-mode";

export const useFirstLoad = () => useState("first-loaded", () => true);
export const useGithubToken = () => useState(GithubTokenKey, () => "");
export const useCorrectSha = () => useState("correct-sha", () => "");
export const useUnsavedContent = () => useState("unsaved-content", () => false);
export const useThemeMode = () => {
  const isFirst = useState(`${ThemeModeKey}-is-first`, () => true);
  const themeMode = useState<"light" | "dark">(ThemeModeKey, () => "light");
  themeMode.value = getLocalStorage(ThemeModeKey) || "light";
  return {
    themeMode,
    toggleThemeMode: () => {
      document.body.classList.remove(`${themeMode.value}-mode`);
      themeMode.value = themeMode.value === "light" ? "dark" : "light";
      document.body.classList.add(`${themeMode.value}-mode`);
      setLocalStorage(ThemeModeKey, themeMode.value);
      if (isFirst) {
        isFirst.value = false;
      }
    },
    isFirst
  };
};
