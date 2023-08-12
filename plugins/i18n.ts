import { i18nLocales } from "~/utils/common/locales";
import { translate, translateT, translateTT } from "~/utils/nuxt";

export default defineNuxtPlugin((app) => {
  const { i18nCode } = useI18nCode();
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
      t: (...args: Parameters<typeof translate>) => computed(() => {
        return translate(...args);
      }).value,
      T: (...args: Parameters<typeof translate>) => computed(() => {
        return translateT(...args);
      }).value,
      TT: (...args: Parameters<typeof translate>) => computed(() => {
        return translateTT(...args);
      }).value
    }
  };
});
