import { translate } from "~/utils/nuxt/i18n";

export default defineNuxtPlugin(() => {
  const unSavedContent = useUnsavedContent();
  window.onbeforeunload = () => {
    if (unSavedContent.value) {
      return translate("confirm-leave");
    }
  };
  addRouteMiddleware("unload", () => {
    if (unSavedContent.value) {
      if (!confirm(translate("confirm-leave"))) {
        return abortNavigation();
      }
      unSavedContent.value = false;
    }
  }, { global: true });
});
