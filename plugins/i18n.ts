import capitalize from "lodash/capitalize";
import { getLocalStorage } from "~/utils/utils";

export default defineNuxtPlugin((app: NuxtApp) => {
  app.$i18n.setLocale(getLocalStorage("locale-lang"));

  app.provide("T", (...args) => capitalize(app.$i18n.t(...args)));
  app.provide("TT", (...args) => app.$i18n.t(...args).toUpperCase());
});
