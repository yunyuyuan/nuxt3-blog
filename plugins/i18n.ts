import capitalize from "lodash/capitalize";

export default defineNuxtPlugin((app) => {
  app.hook("vue:setup", () => {
    useHead({
      htmlAttrs: computed(() => {
        const prop = useNuxtApp().$i18n.localeProperties.value;
        return {
          lang: prop.iso
        };
      })
    });
  });

  app.provide("T", (...args: Parameters<typeof app.$i18n.t>) => capitalize(app.$i18n.t(...args)));
  app.provide("TT", (...args: Parameters<typeof app.$i18n.t>) => app.$i18n.t(...args).toUpperCase());
});
