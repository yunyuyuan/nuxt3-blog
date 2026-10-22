import { describe, expect, it } from "vitest";
import { defineComponent } from "vue";
import { modalEntries, openModal } from "./modal";
import { notify, notifyEntries, removeNotification } from "./notify";

const Dummy = defineComponent({ render: () => null });

describe("openModal", () => {
  it("adds an entry and resolves with the outcome of the event", async () => {
    const result = openModal<boolean>(Dummy, { title: "t" }, { onOk: true }, false);
    expect(modalEntries).toHaveLength(1);
    const props = modalEntries[0]!.props as Record<string, any>;
    expect(props.modelValue).toBe(true);
    expect(props.title).toBe("t");
    props.onOk();
    await expect(result).resolves.toBe(true);
    expect(modalEntries).toHaveLength(0);
  });

  it("resolves with the closed result after afterClose and removes only its own entry", async () => {
    const first = openModal<string>(Dummy, {}, {}, "first-closed");
    const second = openModal<string>(Dummy, {}, {}, "second-closed");
    expect(modalEntries).toHaveLength(2);
    (modalEntries[0]!.props as Record<string, any>).onAfterClose();
    await expect(first).resolves.toBe("first-closed");
    expect(modalEntries).toHaveLength(1);
    (modalEntries[0]!.props as Record<string, any>).onAfterClose();
    await expect(second).resolves.toBe("second-closed");
    expect(modalEntries).toHaveLength(0);
  });
});

describe("notify", () => {
  it("queues notifications in order and removes them by id", () => {
    notify({ title: "a" });
    notify({ title: "b", type: "error" });
    expect(notifyEntries.map(n => n.title)).toEqual(["a", "b"]);
    removeNotification(notifyEntries[0]!.id);
    expect(notifyEntries.map(n => n.title)).toEqual(["b"]);
    removeNotification(notifyEntries[0]!.id);
    expect(notifyEntries).toHaveLength(0);
  });
});
