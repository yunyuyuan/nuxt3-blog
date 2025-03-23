import { NotificationContainerId, ModalContainerId, ThemeModeKey, I18nStoreKey } from "~/utils/common/constants";
import { initScrollTrigger } from "~/utils/common/scroll-event";
import { getLocalStorage } from "~/utils/nuxt/localStorage";

export default defineNuxtPlugin((app) => {
  initScrollTrigger();

  app.hook("app:suspense:resolve", () => {
    useThemeMode().themeMode.value = getLocalStorage(ThemeModeKey) || "light";
    useI18nCode().changeI18n(getLocalStorage(I18nStoreKey) || useI18nCode().i18nCode.value);
  });

  const fragment = new DocumentFragment();

  const notifyContainer = document.createElement("div");
  notifyContainer.id = NotificationContainerId;
  fragment.appendChild(notifyContainer);

  const modalContainer = document.createElement("div");
  modalContainer.id = ModalContainerId;
  fragment.appendChild(modalContainer);

  document.body.appendChild(fragment);
});
