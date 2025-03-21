import config from "~/config";
import { I18nStoreKey } from "~/utils/common/constants";
import type { I18nCode } from "~/utils/common/locales";
import { loadI18nJson } from "~/utils/nuxt/i18n";
import { setLocalStorage } from "~/utils/nuxt/localStorage";

export const useI18nCode = () => {
  const i18nCode = useState<I18nCode>(I18nStoreKey, () => config.defaultLang as I18nCode);

  return {
    i18nCode,
    changeI18n: async (code: I18nCode) => {
      await loadI18nJson(code);
      i18nCode.value = code;
      setLocalStorage(I18nStoreKey, code);
    }
  };
};
