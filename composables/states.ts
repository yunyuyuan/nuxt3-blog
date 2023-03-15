import { useState } from "#app";
import { GithubTokenKey } from "~/utils/constants";
import { getLocalStorage, setLocalStorage } from "~/utils/utils";
const ThemeModeKey = "theme-mode";

// avoid loading during SSG
export const useFirstLoad = () => useState("first-loaded", () => true);

export const useIsMobile = () => useState("is-mobile", () => true);

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
      document.body.classList.remove(`${themeMode.value}-mode`);
      themeMode.value = themeMode.value === "light" ? "dark" : "light";
      document.body.classList.add(`${themeMode.value}-mode`);
      setLocalStorage(ThemeModeKey, themeMode.value);
    }
  };
};
