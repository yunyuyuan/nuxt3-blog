import { NuxtApp } from "#app";
import { initScrollTrigger } from "~/utils/scroll-event";
import {
  SvgContainerId,
  NotificationContainerId,
  ModalContainerId,
  ViewerAttr
} from "~/utils/constants";

export default defineNuxtPlugin((app: NuxtApp) => {
  app.$router.options.scrollBehavior = () => {
    return { left: 0, top: 0 };
  };

  // That's work fine, page will wait for dynamic import.
  addRouteMiddleware("load-viewer", async (to) => {
    const vueApp = app.vueApp;
    // 目前只有游客详情页面会使用viewer
    if (!vueApp._context.directives.viewer && /^\/[^/]+\/\d{4}/.test(to.path)) {
      const VueViewer = (await import("v-viewer")).default;
      vueApp.use(VueViewer, {
        defaultOptions: {
          filter (img: HTMLImageElement) {
            return img.hasAttribute(ViewerAttr);
          }
        }
      });
    }
  }, { global: true });

  initScrollTrigger();
  // init code theme
  document.body.setAttribute(
    "code-theme",
    localStorage.getItem("code-theme") || "light"
  );

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
