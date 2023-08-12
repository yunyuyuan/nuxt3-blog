import { initScrollTrigger, SvgContainerId, NotificationContainerId, ModalContainerId } from "~/utils/common";

export default defineNuxtPlugin((app: any) => {
  app.$router.options.scrollBehavior = () => {
    return { left: 0, top: 0 };
  };

  initScrollTrigger();
  // init theme
  document.body.setAttribute(
    "code-theme",
    localStorage.getItem("code-theme") || "light"
  );
  document.documentElement.classList.add(`${useThemeMode().themeMode.value}-mode`);

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
  return {
    provide: {
      sameSha: computed(() => {
        return useCorrectSha().value === useRuntimeConfig().app.NUXT_ENV_CURRENT_GIT_SHA;
      })
    }
  };
});
