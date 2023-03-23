import { translateT } from "~/utils/nuxt";

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
