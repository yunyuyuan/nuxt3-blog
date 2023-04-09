import { useState } from "#app";
import { GithubTokenKey } from "~/utils/common";
import { getLocalStorage, setLocalStorage } from "~/utils/nuxt";
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
    }
  };
};

export const useCurrentMenu = () => useState<{size: "big"|"small", text: string, url: string}[]>("current-md-menu", () => []);
