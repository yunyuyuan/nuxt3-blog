import { describe, expect, it, vi } from "vitest";
import { useMarkdownParser } from "./useMarkdownParser";

const timeout = () => new Promise(resolve => setTimeout(resolve, 16));

describe("useMarkdownParser", () => {
  it("should works", async () => {
    const destroyFns: CallableFunction[] = [];
    const mdValueRef = ref("# Hello World\n# test ![sticker](aru/1)");
    const { htmlContent, menuItems } = await useMarkdownParser({ mdValueRef, destroyFns });
    await timeout();
    expect(htmlContent.value).toContain(">Hello World</");
    expect(menuItems.value).lengthOf(2);
    destroyFns.forEach(fn => fn());
  });

  it("waits until the markdown ref is connected before enhancing it", async () => {
    vi.stubGlobal("requestIdleCallback", (callback: IdleRequestCallback) => {
      callback({ didTimeout: false, timeRemaining: () => 50 });
      return 1;
    });
    const destroyFns: CallableFunction[] = [];
    const mdValueRef = ref("#[example](https://example.com)");
    const { htmlContent, markdownRef } = await useMarkdownParser({ mdValueRef, destroyFns });
    const markdownEl = document.createElement("article");
    markdownEl.innerHTML = htmlContent.value;

    markdownRef.value = markdownEl;
    await nextTick();
    expect(markdownEl.querySelector("a")?.dataset.processed).toBeUndefined();

    document.body.appendChild(markdownEl);
    await vi.waitFor(() => {
      expect(markdownEl.querySelector("a")?.dataset.processed).toBe("true");
    });

    destroyFns.forEach(fn => fn());
    markdownEl.remove();
    vi.unstubAllGlobals();
  });
});
