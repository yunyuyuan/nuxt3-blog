import { shallowReactive } from "vue";

export type NotifyType = "success" | "warn" | "error";

export type NotifyOption = {
  type?: NotifyType;
  title: string;
  description?: string;
};

type NotifyEntry = NotifyOption & { id: number };

/** 由 <NotificationHost> 渲染的通知列表。通知在动画结束后（destroy 事件）移除 */
export const notifyEntries = shallowReactive<NotifyEntry[]>([]);
let nextId = 0;

export function removeNotification(id: number) {
  const index = notifyEntries.findIndex(n => n.id === id);
  if (index >= 0) {
    notifyEntries.splice(index, 1);
  }
}

export function notify(options: NotifyOption) {
  // 通知只在浏览器中显示；服务端的模块级列表会在请求之间累积
  if (import.meta.server) {
    return;
  }
  notifyEntries.push({ ...options, id: ++nextId });
}
