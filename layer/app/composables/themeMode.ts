import { ThemeModeKey } from "#layers/nuxt3-blog/app/utils/common/constants";
import { setLocalStorage } from "#layers/nuxt3-blog/app/utils/nuxt/localStorage";

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
