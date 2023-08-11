import { i18nLocales } from "~/utils/common/locales";
import { loadI18nJson, translate, translateT, translateTT } from "~/utils/nuxt";

export default defineNuxtPlugin(async (app) => {
  const i18nCode = useI18nCode();
  await loadI18nJson(i18nCode.value, true);
  app.hook("vue:setup", () => {
    useHead({
      htmlAttrs: computed(() => {
        return {
          lang: i18nLocales.find(i => i.code === i18nCode.value)!.iso
        };
      })
    });
  });

  app.provide("t", (...args: [name: string, params: string[]]) => computed(() => {
    const code = useI18nCode().value;
    return translate(...args, code);
  }).value);
  app.provide("T", (...args: [name: string, params: string[]]) => computed(() => {
    const code = useI18nCode().value;
    return translateT(...args, code);
  }).value);
  app.provide("TT", (...args: [name: string, params: string[]]) => computed(() => {
    const code = useI18nCode().value;
    return translateTT(...args, code);
  }).value);
});
