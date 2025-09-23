import { createApp, createVNode, render, type FunctionalComponent } from "vue";
import { SquareArrowOutUpRight, Clipboard } from "lucide-vue-next";
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
    if (mdEl.querySelector<HTMLPreElement>("pre.mermaid:not([data-processed])")) {
      const mermaid = (await import("mermaid")).default;
      await mermaid.run();
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

function createSvgIcon(
  component: FunctionalComponent,
  tag: keyof HTMLElementTagNameMap = "span"
) {
  const el = document.createElement(tag);
  render(createVNode(component), el);
  return el;
}
