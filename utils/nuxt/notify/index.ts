import { createVNode, render } from "vue";
import notification from "./common-notification.vue";
import { NotificationContainerId } from "~/utils/common";

export type NotifyType = "success" | "warn" | "error";

export type NotifyOption = {
  type?: NotifyType;
  title: string;
  description?: string;
};

export function notify (options: NotifyOption) {
  const container = document.createElement("div");
  const vm = createVNode(notification, options);
  vm.props!.onDestroy = () => {
    render(null, container);
  };
  render(vm, container);
  document
    .getElementById(NotificationContainerId)!
    .appendChild(container.firstElementChild!);
}
