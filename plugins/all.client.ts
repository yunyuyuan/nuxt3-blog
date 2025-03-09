import { SvgContainerId, NotificationContainerId, ModalContainerId, ThemeModeKey, I18nStoreKey } from "~/utils/common/constants";
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

  const svgContainer = document.createElement("div");
  svgContainer.id = SvgContainerId;
  svgContainer.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  svgContainer.setAttribute(
    "style",
    "position: absolute; width: 0; height: 0;overflow: hidden"
  );
  fragment.appendChild(svgContainer);

  document.body.appendChild(fragment);
});
