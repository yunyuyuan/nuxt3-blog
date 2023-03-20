import capitalize from "lodash/capitalize";
import { NuxtApp } from "#app";

export default defineNuxtPlugin((app: NuxtApp) => {
  app.provide("T", (...args: Parameters<typeof app.$i18n.t>) => capitalize(app.$i18n.t(...args)));
  app.provide("TT", (...args: Parameters<typeof app.$i18n.t>) => app.$i18n.t(...args).toUpperCase());
});
