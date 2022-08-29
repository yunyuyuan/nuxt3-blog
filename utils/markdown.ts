import { createApp, createVNode, render } from "vue";
import { inBrowser } from "./constants";
import { notify } from "./notify/notify";
import lazyImgVue from "~/components/the-lazy-img.vue";
import svgIconVue from "~/components/svg-icon.vue";

/* HACK recursive regex replace. because the fucking safari don't support lookbehind, all of `(^|(?>=[^\\]))` need to be changed to `(^|[^\\])` */
function recursiveReplace (
  text: string,
  regex: RegExp,
  cb: (_substring: string, ..._args: string[]) => string
) {
  let result = text;
  while (regex.test(result)) {
    result = result.replace(new RegExp(regex, "g"), cb);
  }
  return result;
}

const paragraphTabExtension = {
  type: "lang",
  filter (text) {
    return recursiveReplace(text, /(^|\n)<<>>/, (_a, prefix) => {
      return `${prefix}&emsp;&emsp;`;
    });
  }
};
const headerExtension = {
  type: "lang",
  filter (text, converter) {
    return recursiveReplace(
      text,
      /(^|\n)(#{1,6})\s*(.+?)\s*(?=\n|$)/,
      (_a, prefix, tone, content) => {
        const size = tone.length;
        const anchor = "id-" + encodeURIComponent(content);
        return `${prefix}<h${size}><sup class="fake-head" id="${anchor}"></sup><a class="header-link" href="#${anchor}">${converter.makeHtml(
          content
        )}</a></h${size}>`;
      }
    );
  }
};
const blankLinkExtension = {
  type: "lang",
  filter (text) {
    return recursiveReplace(
      text,
      /(^|[^\\])#\[(.*?)]\((.*?)\)/,
      (_a, prefix, txt, link) => {
        return `${prefix}<a target="_blank" href="${link}">${txt}</a>`;
      }
    );
  }
};
const commonImgExtension = {
  type: "lang",
  filter (text) {
    return recursiveReplace(
      text,
      /(^|[^\\])!\[(.*?)]\((.*?)\)/,
      (_a, prefix, alt, src) => {
        // sticker
        if (alt === "sticker") {
          const matcher = src.match(/^(.*?)\/(\d*)$/);
          if (matcher) {
            const [, name, tone] = matcher;
            return `${prefix}<img src="/sticker/${name}/${tone}.png?ran=${useRuntimeConfig().public.timestamp}" alt="${alt}"/>`;
          }
        }
        const mather = alt.match(/^(.*?)\[(.*?) x (.*?)]$/);
        if (!mather) {
          return `${prefix}<span class="image-container"><img alt="${alt}" title="${alt}" src="${src}"/><small class="desc">${alt}</small></span>`;
        }
        // with dimension
        const [, alt_, w, h] = mather;
        const justHeight = !w;
        return `${prefix}<span class="image-container${
          justHeight ? " just-height" : ""
        }"><img alt="${alt_}" title="${alt_}" style="${
          w ? `width: ${w} !important;` : ""
        }${
          h ? `height: ${h} !important;` : ""
        }" src="${src}"/><small class="desc">${alt_}</small></span>`;
      }
    );
  }
};
const colorTextExtension = {
  type: "lang",
  filter (text) {
    return recursiveReplace(
      text,
      /(^|[^\\])-\(([#a-zA-Z0-9]+): (.*?)\)-/,
      (_a, prefix, color, txt) => {
        return `${prefix}<span style="color: ${color}">${txt}</span>`;
      }
    );
  }
};
const htmlExtension = {
  type: "lang",
  filter (text) {
    return recursiveReplace(
      text,
      /(^|[^\\])\[html]([\s\S]*?)\[\/html]/,
      (_a, prefix, txt) => {
        return `${prefix}<span class="raw-html">${txt}</span>`;
      }
    );
  }
};
const youtubeExtension = {
  type: "lang",
  filter (text) {
    return recursiveReplace(
      text,
      /(^|[^\\])\[youtube]\[(.+?)]\((https?:\/\/.*?)\)\[\/youtube]/,
      (_a, prefix, txt, src) => {
        return `${prefix}<div class="embed-video youtube">
                        <iframe src="${src}" title="${txt}" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        <small class="desc">${txt}</small>
                    </div>`;
      }
    );
  }
};
const biliExtension = {
  type: "lang",
  filter (text) {
    return recursiveReplace(
      text,
      /(^|[^\\])\[bili]\[(.+?)]\((https?:\/\/.*?)\)\[\/bili]/,
      (_a, prefix, txt, src) => {
        return `${prefix}<div class="embed-video bili">
                        <iframe src="${src}" title="${txt}" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                        <small class="desc">${txt}</small>
                    </div>`;
      }
    );
  }
};
const fieldExtension = {
  type: "lang",
  filter (text, converter) {
    return recursiveReplace(
      text,
      /(^|\n)--(.*?)--\n([\s\S]+)\n-- --/,
      (_a, prefix, legend, content) => {
        return `${prefix}<fieldset><legend>${converter.makeHtml(
          legend
        )}</legend>${converter.makeHtml(content)}</fieldset>`;
      }
    );
  }
};

const options = {
  tables: true,
  tasklists: true,
  backslashEscapesHTMLTags: true,
  strikethrough: true
};
let converter = null;

export async function parseMarkdown (text: string) {
  if (!converter) {
    const showdown = (await import("showdown")).default as any;
    converter = new showdown.Converter({
      ...options,
      extensions: [
        headerExtension,
        paragraphTabExtension,
        blankLinkExtension,
        commonImgExtension,
        htmlExtension,
        colorTextExtension,
        fieldExtension,
        youtubeExtension,
        biliExtension
      ]
    });
  }
  return converter.makeHtml(text);
}

export function afterInsertHtml (mdEl: HTMLElement, forEdit = false, htmlInserted = null) {
  const destroyFns: (()=>void)[] = [];
  nextTick(async () => {
    if (inBrowser) {
      // hljs
      mdEl.querySelectorAll("pre>code:not(.hljs)").forEach(async (el: HTMLElement) => {
        const dotes = document.createElement("div");
        const lang = document.createElement("small");
        const language = el.className.replace(/^.*?language-([^ ]+).*?$/, "$1");
        const hljs = (await import("highlight.js")).default as any;
        lang.innerText = (
          hljs.getLanguage(language) || { name: language }
        ).name;
        el.parentElement.insertBefore(dotes, el);
        el.parentElement.insertBefore(lang, dotes);
        hljs.highlightElement(el);
      });
    }
    // 方便起见，edit下不会创建svg-icon，**只有**游客界面才会创建
    if (!forEdit) {
      if (!useNuxtApp().$isMobile) {
        mdEl.querySelectorAll("pre>code:not(.ps)").forEach(async (el) => {
          const PerfectScrollbar = (await import("perfect-scrollbar")).default as any;
          const scrollbar = new PerfectScrollbar(el);
          destroyFns.push(() => scrollbar.destroy());
        });
      }
      mdEl
        .querySelectorAll(".image-container > img")
        .forEach((el: HTMLImageElement) => {
          const style = el.getAttribute("style");
          const title = (el.nextElementSibling as HTMLElement).innerText;
          const vm = createApp(lazyImgVue, {
            src: el.getAttribute("src"),
            alt: title,
            viewer: true,
            compStyle: style,
            imgStyle: el.parentElement.classList.contains("just-height")
              ? style
              : "",
            title
          });
          const alt = el.nextElementSibling;
          vm.mount(el.parentElement);
          vm._container.appendChild(alt);
          destroyFns.push(() => {
            vm.unmount();
          });
        });
      // copy <pre>
      mdEl.querySelectorAll("pre:not(.processed-pre)").forEach(async (el: HTMLPreElement) => {
        el.classList.add("processed-pre");
        const actions = document.createElement("span");
        el.insertBefore(actions, el.children[0]);
        const themeBtn = createSvgIcon("code-theme", (span) => {
          span.classList.add("code-theme");
          actions.appendChild(span);
        });
        themeBtn.title = "theme";
        themeBtn.onclick = () => {
          const body = document.body;
          const theme =
          body.getAttribute("code-theme") === "light" ? "dark" : "light";
          body.setAttribute("code-theme", theme);
          localStorage.setItem("code-theme", theme);
        };
        const copyBtn = createSvgIcon("copy", (span) => {
          span.classList.add("copy");
          actions.appendChild(span);
        });
        copyBtn.title = "copy";
        const ClipboardJS = (await import("clipboard")).default as any;
        const clipboard = new ClipboardJS(copyBtn, {
          target: function (trigger) {
            return trigger.parentElement.parentElement.querySelector("code");
          }
        }).on("success", (e) => {
          e.clearSelection();
          notify({
            title: "复制成功！"
          });
        });
        destroyFns.push(() => {
          clipboard.destroy();
        });
      });
      // target=_blank
      mdEl.querySelectorAll("a[target=_blank]:not(.processed-a)").forEach((el) => {
        el.classList.add("processed-a");
        createSvgIcon("open-link", (span) => {
          span.classList.add("open-link");
          el.appendChild(span);
        });
      });
    }
    const pangu = (await import("pangu")).default as any;
    pangu.spacingElementByClassName("--markdown");
    htmlInserted && (htmlInserted.value = true);
  });
  return destroyFns;
}

function createSvgIcon (
  name: string,
  process: (_span: HTMLSpanElement) => void
) {
  const span = document.createElement("span");
  process(span);
  render(createVNode(svgIconVue, { name }), span);
  return span;
}
