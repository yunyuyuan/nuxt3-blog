import { createApp, createVNode, render, type FunctionalComponent } from "vue";
import { SquareArrowOutUpRight, Clipboard, ZoomIn, ZoomOut, Maximize2, Minimize2 } from "lucide-vue-next";
import { pangu } from "pangu/browser";
import { initHljs } from "../common/hljs";
import { translate } from "./i18n";
import { notify } from "./notify";
import lazyImgVue from "~/components/the-lazy-img.vue";

export async function afterInsertHtml(mdEl: HTMLElement, forEdit = false) {
  const destroyFns: CallableFunction[] = [];
  await nextTick(async () => {
    // hljs
    mdEl.querySelectorAll<HTMLElement>("pre>code").forEach(async (el) => {
      const hljs = initHljs((await import("highlight.js")).default);
      if (!el.classList.contains("hljs")) {
        hljs.highlightElement(el);
      }
    });
    // katex
    mdEl
      .querySelectorAll<HTMLDivElement>(".math-formula:not(.parsed)")
      .forEach(async (el) => {
        const realEl = el.classList.contains("block") ? el.children[0] as HTMLElement : el;
        realEl.innerHTML = (await import("katex")).default.renderToString(realEl.innerText);
        el.classList.add("parsed");
      });
    // mermaid
    const mermaidBlocks = mdEl.querySelectorAll<HTMLPreElement>("pre.mermaid-block");
    if (mermaidBlocks.length) {
      const originalContent = Array.from(mermaidBlocks).map(pre => pre.textContent.trim());
      const mermaid = (await import("mermaid")).default;
      watch(useThemeMode().themeMode, async (themeMode) => {
        mermaidBlocks.forEach((pre, index) => {
          pre.removeAttribute("data-processed");
          if (originalContent[index]) {
            pre.innerHTML = originalContent[index];
          }
        });
        mermaid.initialize({
          theme: themeMode === "light" ? "default" : "dark"
        });
        await mermaid.run({
          nodes: mermaidBlocks
        });
        mermaidBlocks.forEach((pre) => {
          const cleanup = setupMermaidPanZoom(pre);
          if (cleanup) {
            destroyFns.push(cleanup);
          }
        });
      }, { immediate: true });
    }
    // lazy-img
    mdEl
      .querySelectorAll<HTMLImageElement>(".image-container > img")
      .forEach((el) => {
        const style = el.getAttribute("style");
        const title = (el.nextElementSibling as HTMLElement).innerText;
        const vm = createApp(lazyImgVue, {
          src: el.getAttribute("src"),
          alt: title,
          viewer: true,
          compStyle: style,
          noLazy: forEdit,
          imgStyle: el.parentElement!.classList.contains("just-height")
            ? style
            : "",
          title
        });
        const alt = el.nextElementSibling!;
        vm.mount(el.parentElement!);
        vm._container!.appendChild(alt);
        destroyFns.push(() => {
          vm.unmount();
        });
      });
    // copy button in <pre>
    mdEl.querySelectorAll<HTMLPreElement>("pre:not([data-processed])").forEach(async (el) => {
      el.dataset.processed = "true";
      const copyBtn = createSvgIcon(Clipboard);
      copyBtn.title = "copy";
      const ClipboardJS = (await import("clipboard")).default;
      const clipboard = new ClipboardJS(copyBtn, {
        target: function (trigger: HTMLElement) {
          return trigger.parentElement!.querySelector("code")!;
        }
      }).on("success", (e) => {
        e.clearSelection();
        notify({
          title: translate("copy-successful")
        });
      });
      destroyFns.push(() => {
        clipboard.destroy();
      });
      el.appendChild(copyBtn);
    });
    // target=_blank link
    mdEl.querySelectorAll<HTMLLinkElement>("a[target=_blank]:not([data-processed])").forEach((el) => {
      el.dataset.processed = "true";
      el.appendChild(createSvgIcon(SquareArrowOutUpRight));
    });

    pangu.spacingNode(mdEl);
  });
  return destroyFns;
}

function setupMermaidPanZoom(preEl: HTMLPreElement) {
  const svg = preEl.querySelector<SVGSVGElement>("svg");
  if (!svg || svg.dataset.panzoom === "true") {
    return;
  }

  svg.dataset.panzoom = "true";
  svg.style.transformOrigin = "0 0";

  const setCursor = (value: string) => {
    svg.style.cursor = value;
    preEl.style.cursor = value;
  };

  setCursor("grab");
  svg.style.touchAction = "none";
  svg.style.userSelect = "none";
  preEl.style.touchAction = "none";
  preEl.style.userSelect = "none";

  const clamp = (value: number, min: number, max: number) =>
    Math.min(Math.max(value, min), max);

  const state = {
    scale: 1,
    translateX: 0,
    translateY: 0,
    minScale: 0.5,
    maxScale: 3,
    pointerId: undefined as number | undefined,
    startX: 0,
    startY: 0,
    startTranslateX: 0,
    startTranslateY: 0
  };

  let controls: HTMLDivElement | undefined;
  let zoomInBtn: HTMLButtonElement | undefined;
  let zoomOutBtn: HTMLButtonElement | undefined;
  let fullscreenBtn: HTMLButtonElement | undefined;

  const isFromControls = (target: EventTarget | null) =>
    target instanceof HTMLElement && Boolean(target.closest(".mermaid-controls"));

  const updateZoomButtons = () => {
    if (!zoomInBtn || !zoomOutBtn) {
      return;
    }
    zoomOutBtn.disabled = state.scale <= state.minScale + 0.01;
    zoomInBtn.disabled = state.scale >= state.maxScale - 0.01;
  };

  const applyTransform = () => {
    svg.style.transform = `translate(${state.translateX}px, ${state.translateY}px) scale(${state.scale})`;
    updateZoomButtons();
  };

  const zoomTo = (targetScale: number, originClientX: number, originClientY: number) => {
    const rect = svg.getBoundingClientRect();
    const clampedScale = clamp(targetScale, state.minScale, state.maxScale);
    const offsetX = originClientX - rect.left;
    const offsetY = originClientY - rect.top;
    const scaleChange = clampedScale / state.scale;

    state.translateX = offsetX - (offsetX - state.translateX) * scaleChange;
    state.translateY = offsetY - (offsetY - state.translateY) * scaleChange;
    state.scale = clampedScale;

    applyTransform();
  };

  const zoomBy = (factor: number) => {
    const rect = svg.getBoundingClientRect();
    zoomTo(state.scale * factor, rect.left + rect.width / 2, rect.top + rect.height / 2);
  };

  const resetTransform = () => {
    state.scale = 1;
    state.translateX = 0;
    state.translateY = 0;
    applyTransform();
  };

  const clearPointerState = (pointerId: number) => {
    if (state.pointerId !== pointerId) {
      return;
    }

    try {
      preEl.releasePointerCapture(pointerId);
    } catch {
      // ignore
    }

    state.pointerId = undefined;
    setCursor("grab");
  };

  const onWheel = (event: WheelEvent) => {
    if (isFromControls(event.target)) {
      return;
    }

    event.preventDefault();
    const zoomFactor = event.deltaY < 0 ? 1.1 : 0.9;
    zoomTo(state.scale * zoomFactor, event.clientX, event.clientY);
  };

  const onPointerDown = (event: PointerEvent) => {
    if (event.button !== 0 && event.pointerType === "mouse") {
      return;
    }

    if (isFromControls(event.target)) {
      return;
    }

    state.pointerId = event.pointerId;
    state.startX = event.clientX;
    state.startY = event.clientY;
    state.startTranslateX = state.translateX;
    state.startTranslateY = state.translateY;

    try {
      preEl.setPointerCapture(event.pointerId);
    } catch {
      // ignore
    }

    setCursor("grabbing");
  };

  const onPointerMove = (event: PointerEvent) => {
    if (state.pointerId !== event.pointerId) {
      return;
    }

    if (event.buttons === 0) {
      clearPointerState(event.pointerId);
      return;
    }

    event.preventDefault();

    const dx = event.clientX - state.startX;
    const dy = event.clientY - state.startY;

    state.translateX = state.startTranslateX + dx;
    state.translateY = state.startTranslateY + dy;

    applyTransform();
  };

  const onPointerUp = (event: PointerEvent) => {
    clearPointerState(event.pointerId);
  };

  const onPointerCancel = (event: PointerEvent) => {
    clearPointerState(event.pointerId);
  };

  const onDoubleClick = (event: MouseEvent) => {
    if (isFromControls(event.target)) {
      return;
    }

    event.preventDefault();
    resetTransform();
  };

  const stopPointerPropagation = (event: PointerEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };

  const getFullscreenElement = () =>
    document.fullscreenElement ?? (document as unknown as { webkitFullscreenElement?: Element }).webkitFullscreenElement ?? null;

  const updateFullscreenButton = (isFullscreen: boolean) => {
    if (!fullscreenBtn) {
      return;
    }
    fullscreenBtn.replaceChildren(createSvgIcon(isFullscreen ? Minimize2 : Maximize2));
    const title = isFullscreen ? "Exit fullscreen" : "Enter fullscreen";
    fullscreenBtn.title = title;
    fullscreenBtn.setAttribute("aria-label", title);
  };

  const toggleFullscreen = () => {
    const current = getFullscreenElement();
    const element = preEl as HTMLElement & { webkitRequestFullscreen?: () => Promise<void> };
    const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> };

    if (current === preEl) {
      if (doc.exitFullscreen) {
        void doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    } else {
      if (element.requestFullscreen) {
        void element.requestFullscreen().catch(() => {});
      } else if (element.webkitRequestFullscreen) {
        element.webkitRequestFullscreen();
      }
    }
  };

  const onFullscreenChange = () => {
    const isFullscreen = getFullscreenElement() === preEl;
    preEl.classList.toggle("mermaid-fullscreen", isFullscreen);
    updateFullscreenButton(isFullscreen);
  };

  const fullscreenEvents = ["fullscreenchange", "webkitfullscreenchange"] as const;

  controls = document.createElement("div");
  controls.className = "mermaid-controls";

  const createControlButton = (
    icon: FunctionalComponent,
    title: string,
    onClick: () => void
  ) => {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "mermaid-control-btn";
    button.title = title;
    button.setAttribute("aria-label", title);
    button.appendChild(createSvgIcon(icon));
    button.addEventListener("click", onClick);
    button.addEventListener("pointerdown", stopPointerPropagation);
    return button;
  };

  const handleZoomIn = () => {
    zoomBy(1.2);
  };

  const handleZoomOut = () => {
    zoomBy(0.8);
  };

  zoomInBtn = createControlButton(ZoomIn, "Zoom in", handleZoomIn);
  zoomOutBtn = createControlButton(ZoomOut, "Zoom out", handleZoomOut);
  fullscreenBtn = createControlButton(Maximize2, "Enter fullscreen", toggleFullscreen);

  controls.append(zoomInBtn, zoomOutBtn, fullscreenBtn);
  preEl.appendChild(controls);
  preEl.dataset.mermaidControls = "true";

  fullscreenEvents.forEach((eventName) => {
    document.addEventListener(eventName, onFullscreenChange);
  });

  preEl.addEventListener("wheel", onWheel, { passive: false });
  preEl.addEventListener("pointerdown", onPointerDown);
  preEl.addEventListener("pointermove", onPointerMove);
  preEl.addEventListener("pointerup", onPointerUp);
  preEl.addEventListener("pointercancel", onPointerCancel);
  preEl.addEventListener("dblclick", onDoubleClick);

  updateZoomButtons();
  updateFullscreenButton(false);

  return () => {
    preEl.removeEventListener("wheel", onWheel);
    preEl.removeEventListener("pointerdown", onPointerDown);
    preEl.removeEventListener("pointermove", onPointerMove);
    preEl.removeEventListener("pointerup", onPointerUp);
    preEl.removeEventListener("pointercancel", onPointerCancel);
    preEl.removeEventListener("dblclick", onDoubleClick);

    fullscreenEvents.forEach((eventName) => {
      document.removeEventListener(eventName, onFullscreenChange);
    });

    zoomInBtn?.removeEventListener("click", handleZoomIn);
    zoomOutBtn?.removeEventListener("click", handleZoomOut);
    fullscreenBtn?.removeEventListener("click", toggleFullscreen);
    zoomInBtn?.removeEventListener("pointerdown", stopPointerPropagation);
    zoomOutBtn?.removeEventListener("pointerdown", stopPointerPropagation);
    fullscreenBtn?.removeEventListener("pointerdown", stopPointerPropagation);

    const current = getFullscreenElement();
    if (current === preEl) {
      const doc = document as Document & { webkitExitFullscreen?: () => Promise<void> };
      if (doc.exitFullscreen) {
        void doc.exitFullscreen().catch(() => {});
      } else if (doc.webkitExitFullscreen) {
        doc.webkitExitFullscreen();
      }
    }

    controls?.remove();
    controls = undefined;
    zoomInBtn = undefined;
    zoomOutBtn = undefined;
    fullscreenBtn = undefined;
    preEl.classList.remove("mermaid-fullscreen");
    delete preEl.dataset.mermaidControls;

    svg.style.transform = "";
    setCursor("");
    svg.style.touchAction = "";
    svg.style.userSelect = "";
    preEl.style.touchAction = "";
    preEl.style.userSelect = "";
    delete svg.dataset.panzoom;
  };
}

function createSvgIcon(
  component: FunctionalComponent,
  tag: keyof HTMLElementTagNameMap = "span"
) {
  const el = document.createElement(tag);
  render(createVNode(component), el);
  return el;
}
