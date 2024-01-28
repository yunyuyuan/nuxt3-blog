import { type I18nCode, i18nLocales } from "~/utils/common/locales";
import { translate, translateT, translateTT } from "~/utils/nuxt";

export default defineNuxtPlugin(async (app) => {
  app.provide("i18nMessages", ref<Partial<Record<I18nCode, Record<string, string>>>>({}));
  const { i18nCode, changeI18n } = useI18nCode();
  await changeI18n(i18nCode.value);
  app.hook("vue:setup", () => {
    useHead({
      htmlAttrs: computed(() => {
        return {
          lang: i18nLocales.find(i => i.code === i18nCode.value)!.iso
        };
      })
    });
  });
  return {
    provide: {
      t: (...args: Parameters<typeof translate>) => translate(...args),
      T: (...args: Parameters<typeof translate>) => translateT(...args),
      TT: (...args: Parameters<typeof translate>) => translateTT(...args)
    }
  };
});
