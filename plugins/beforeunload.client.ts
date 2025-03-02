import { translateT } from "~/utils/nuxt/i18n";

export default defineNuxtPlugin(() => {
  const unSavedContent = useUnsavedContent();
  window.onbeforeunload = () => {
    if (unSavedContent.value) {
      return translateT("confirm-leave");
    }
  };
  addRouteMiddleware("unload", () => {
    if (unSavedContent.value) {
      if (!confirm(translateT("confirm-leave"))) {
        return abortNavigation();
      }
      unSavedContent.value = false;
    }
  }, { global: true });
});
