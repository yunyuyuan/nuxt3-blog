import capitalize from "lodash/capitalize";
import { NuxtApp } from "#app";
import { getLocalStorage } from "~/utils/utils";
import config from "~/config";

export default defineNuxtPlugin((app: NuxtApp) => {
  app.$i18n.setLocale(getLocalStorage("locale-lang") || config.defaultLang);

  app.provide("T", (...args: Parameters<typeof app.$i18n.t>) => capitalize(app.$i18n.t(...args)));
  app.provide("TT", (...args: Parameters<typeof app.$i18n.t>) => app.$i18n.t(...args).toUpperCase());
});
