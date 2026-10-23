import { markRaw, shallowReactive, type Component } from "vue";

export type ModalEntry = {
  id: number;
  component: Component;
  props: Record<string, unknown>;
};

/** 由 <ModalHost> 渲染的弹窗列表。弹窗在应用内渲染，自动继承 appContext（i18n、插件等） */
export const modalEntries = shallowReactive<ModalEntry[]>([]);
let nextId = 0;

function remove(id: number) {
  const index = modalEntries.findIndex(m => m.id === id);
  if (index >= 0) {
    modalEntries.splice(index, 1);
  }
}

/**
 * 打开一个基于 CommonModal 的弹窗组件，返回用户操作的结果。
 * @param props 传给组件的 props，modelValue 默认为 true
 * @param outcomes 事件名到结果的映射，例如 { onOk: true }。触发后立即移除弹窗
 * @param closed 弹窗关闭（afterClose）时的结果
 */
export function openModal<T>(component: Component, props: Record<string, unknown>, outcomes: Record<string, T>, closed: T): Promise<T> {
  return new Promise<T>((resolve) => {
    const id = ++nextId;
    const finish = (result: T) => {
      remove(id);
      resolve(result);
    };
    const handlers = Object.fromEntries(Object.entries(outcomes).map(([event, result]) => [event, () => finish(result)]));
    modalEntries.push({
      id,
      component: markRaw(component),
      props: { modelValue: true, ...props, ...handlers, onAfterClose: () => finish(closed) }
    });
  });
}
