import config from "~~/config";
import { type I18nCode, i18nLocales } from "~/utils/common/locales";
import { getI18nJson, translate } from "~/utils/nuxt/i18n";

export default defineNuxtPlugin(async (app) => {
  app.hook("vue:setup", () => {
    const { i18nCode } = useI18nCode();
    useHead({
      // @ts-expect-error only language attribute
      htmlAttrs: computed(() => {
        return {
          lang: i18nLocales.find(i => i.code === i18nCode.value)!.iso
        };
      })
    });
  });
  return {
    provide: {
      i18nMessages: ref({
        [config.defaultLang as I18nCode]: await getI18nJson(config.defaultLang as I18nCode)
      }),
      t: (...args: Parameters<typeof translate>) => translate(...args)
    }
  };
});
