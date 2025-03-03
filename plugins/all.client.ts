import { SvgContainerId, NotificationContainerId, ModalContainerId } from "~/utils/common/constants";
import { initScrollTrigger } from "~/utils/common/scroll-event";

export default defineNuxtPlugin(() => {
  initScrollTrigger();

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
        return useRemoteLatestSha().value === __NB_CURRENT_GIT_SHA__;
      })
    }
  };
});
