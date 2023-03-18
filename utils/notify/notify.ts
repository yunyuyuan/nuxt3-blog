import { createVNode, render } from "vue";
import { NotificationContainerId } from "../constants";
import notification from "./common-notification.vue";

export type NotifyType = "success" | "warn" | "error";

export type NotifyOption = {
  type?: NotifyType;
  title: string;
  description?: string;
};

export function notify (options: NotifyOption) {
  const container = document.createElement("div");
  const vm = createVNode(notification, options);
  vm.props.onDestroy = () => {
    render(null, container);
  };
  render(vm, container);
  document
    .getElementById(NotificationContainerId)!
    .appendChild(container.firstElementChild!);
}
