import { createApp, createVNode, render } from "vue";
import type { Ref } from "vue";
import { translate, notify, isPrerender } from "~/utils/nuxt";
import lazyImgVue from "~/components/the-lazy-img.vue";
import svgIconVue from "~/components/svg-icon.vue";
import { escapeHtml, initHljs, toggleCodeBlockTheme, ViewerAttr } from "~/utils/common";

export async function parseMarkdown (text: string) {
  const hljs = isPrerender ? (await import("highlight.js")).default : null;
  const katex = isPrerender ? (await import("katex")).default : null;
  const marked = (await import("marked")).marked;
  const menuItems: {size: "big"|"small", text: string, url: string}[] = [];
  marked.use({
    gfm: true,
    renderer: {
      heading (text, level, raw, slugger) {
        const url = slugger.slug(raw);

        const menuItem: typeof menuItems[number] = {
          size: level < 3 ? "big" : "small",
          // the "raw" param is not real raw, weird
          // text: escapeHtml(raw),
          text: text.replace(/<\/?[^>]+(>|$)/g, ""),
          url
        };
        menuItems.push(menuItem);
        return `<h${level}><sup class="fake-head" id="${url}"></sup><a class="header-link" href="#${url}">${text}</a></h${level}>`;
      },
      image (href, _, text) {
        // sticker
        if (text === "sticker") {
          const matcher = href?.match(/^(.*?)\/(\d*)$/);
          if (matcher) {
            const [, name, tone] = matcher;
            return `<img src="/sticker/${name}/${tone}.png" alt="${text}"/>`;
          }
        }
        const matcher = text?.match(/^(.*?)\[(.*?) x (.*?)]$/);
        if (!matcher) {
          return `<span class="image-container"><img ${ViewerAttr} alt="${text}" title="${text}" src="${href}"/><small class="desc">${marked.parseInline(text)}</small></span>`;
        }
        // with dimension
        const [, alt_, w, h] = matcher;
        const justHeight = !w;
        return `<span class="image-container${
          justHeight ? " just-height" : ""
        }"><img ${ViewerAttr} alt="${alt_}" title="${marked.parseInline(alt_)}" style="${
          w ? `width: ${w} !important;` : ""
        }${
          h ? `height: ${h} !important;` : ""
        }" src="${href}"/><small class="desc">${marked.parseInline(alt_)}</small></span>`;
      },
      code (code, language, escaped) {
        if (isPrerender) {
          // 在这里parse
          initHljs(hljs!);
          code = hljs!.highlight(code, {
            language: language!
          }, true).value;
        } else {
          // 先escape，留在afterInsertHtml里parse
          code = escaped ? code : escapeHtml(code);
        }
        return `<pre><div></div><small></small><code class="language-${language} ${isPrerender ? "hljs" : ""}">${code}</code></pre>`;
      }
    },
    extensions: [
      // inline level
      {
        name: "indent-two",
        level: "inline",
        start (src: string) { return src.match(/<<>>/)?.index; },
        tokenizer (src: string) {
          const match = /^(<<>>)/.exec(src);
          if (match) {
            return {
              type: "indent-two",
              raw: match[0]
            };
          }
        },
        renderer () {
          return "&emsp;&emsp;";
        }
      },
      {
        name: "target-blank",
        level: "inline",
        start (src: string) { return src.match(/#\[/)?.index; },
        tokenizer (src: string) {
          const match = /^#\[([^\]]+)\]\(([^)]+)\)/.exec(src);
          if (match) {
            return {
              type: "target-blank",
              raw: match[0],
              text: this.lexer.inlineTokens(match[1]),
              href: match[2]
            };
          }
        },
        renderer ({ text, href }) {
          return `<a href="${href}" target="_blank">${this.parser.parseInline(text)}</a>`;
        }
      },
      {
        name: "color-text",
        level: "inline",
        start (src: string) { return src.match(/-\(/)?.index; },
        tokenizer (src: string) {
          const match = /^-\(([#a-zA-Z0-9]+): (.+?)\)-/.exec(src);
          if (match) {
            return {
              type: "color-text",
              raw: match[0],
              color: match[1],
              text: this.lexer.inlineTokens(match[2])
            };
          }
        },
        renderer ({ color, text }) {
          return `<span style="color: ${color}">${this.parser.parseInline(text)}</span>`;
        }
      },
      {
        name: "underline-text",
        level: "inline",
        start (src: string) { return src.match(/_\(/)?.index; },
        tokenizer (src: string) {
          const match = /^_\((.+?)\)_/.exec(src);
          if (match) {
            return {
              type: "underline-text",
              raw: match[0],
              text: this.lexer.inlineTokens(match[1])
            };
          }
        },
        renderer ({ text }) {
          return `<span style="text-decoration: underline">${this.parser.parseInline(text)}</span>`;
        }
      },
      {
        name: "embed-youtube",
        level: "inline",
        start (src: string) { return src.match(/\[youtube]/)?.index; },
        tokenizer (src: string) {
          const match = /^\[youtube]\[(.+?)]\((https?:\/\/.*?)\)\[\/youtube]/.exec(src);
          if (match) {
            return {
              type: "embed-youtube",
              raw: match[0],
              text: this.lexer.inlineTokens(match[1]),
              href: match[2]
            };
          }
        },
        renderer ({ text, href }) {
          text = this.parser.parseInline(text);
          return `<div class="embed-media youtube">
                      <iframe src="${href}" title="${text}" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                      <small class="desc">${text}</small>
                  </div>`;
        }
      },
      {
        name: "embed-bili",
        level: "inline",
        start (src: string) { return src.match(/\[youtube]/)?.index; },
        tokenizer (src: string) {
          const match = /^\[bili]\[(.+?)]\((https?:\/\/.*?)\)\[\/bili]/.exec(src);
          if (match) {
            return {
              type: "embed-bili",
              raw: match[0],
              text: this.lexer.inlineTokens(match[1]),
              href: match[2]
            };
          }
        },
        renderer ({ text, href }) {
          text = this.parser.parseInline(text);
          return `<div class="embed-media bili">
                      <iframe src="${href}" title="${text}" frameborder="0" allow="accelerometer; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
                      <small class="desc">${text}</small>
                  </div>`;
        }
      },
      {
        name: "embed-media",
        level: "inline",
        start (src: string) { return src.match(/\[video]/)?.index; },
        tokenizer (src: string) {
          const match = /^\[video]\[(.+?)]\((?:(https?:\/\/.+?)\|)?(https?:\/\/.+?)\)\[\/video]/.exec(src);
          if (match) {
            return {
              type: "embed-media",
              raw: match[0],
              text: this.lexer.inlineTokens(match[1]),
              poster: match[2],
              href: match[3]
            };
          }
        },
        renderer ({ text, poster, href }) {
          text = this.parser.parseInline(text);
          return `<div class="embed-media vanilla-video">
                      <video src="${href}" controls${poster ? ` poster="${poster}"` : ""}></video>
                      <small class="desc">${text}</small>
                  </div>`;
        }
      },
      {
        name: "embed-audio",
        level: "inline",
        start (src: string) { return src.match(/\[video]/)?.index; },
        tokenizer (src: string) {
          const match = /^\[audio]\[(.+?)]\((https?:\/\/.+?)\)\[\/audio]/.exec(src);
          if (match) {
            return {
              type: "embed-audio",
              raw: match[0],
              text: this.lexer.inlineTokens(match[1]),
              href: match[2]
            };
          }
        },
        renderer ({ text, href }) {
          text = this.parser.parseInline(text);
          return `<div class="embed-media vanilla-audio">
                      <audio src="${href}" controls></audio>
                      <small class="desc">${text}</small>
                  </div>`;
        }
      },
      {
        name: "math-formula-inline",
        level: "inline",
        start (src: string) { return src.match(/\$\$/)?.index; },
        tokenizer (src: string) {
          const match = /^\$\$([\s\S]+?)\$\$/.exec(src);
          if (match) {
            return {
              type: "math-formula-inline",
              raw: match[0],
              content: match[1]
            };
          }
        },
        renderer ({ content }) {
          return `<span class="math-formula inline ${isPrerender ? "parsed" : ""}">${isPrerender ? katex!.renderToString(content, { strict: "ignore" }) : content}</span>`;
        }
      },
      // block level
      {
        name: "math-formula-block",
        level: "block",
        start (src: string) { return src.match(/\$\$\n/)?.index; },
        tokenizer (src: string) {
          const match = /^\$\$\n([\s\S]+?)\n\$\$/.exec(src);
          if (match) {
            return {
              type: "math-formula-block",
              raw: match[0],
              content: match[1]
            };
          }
        },
        renderer ({ content }) {
          return `<div class="math-formula block ${isPrerender ? "parsed" : ""}"><div>${isPrerender ? katex!.renderToString(content, { strict: "ignore" }) : content}</div></div>`;
        }
      },
      {
        name: "raw-html",
        level: "block",
        start (src: string) { return src.match(/\[html]/)?.index; },
        tokenizer (src: string) {
          const match = /^\[html]([\s\S]*?)\[\/html]/.exec(src);
          if (match) {
            return {
              type: "raw-html",
              raw: match[0],
              text: this.lexer.blockTokens(match[1], [])
            };
          }
        },
        renderer ({ text }) {
          return `<span class="raw-html">${this.parser.parse(text)}</span>`;
        }
      },
      {
        name: "fieldset-block",
        level: "block",
        start (src: string) { return src.match(/--.*?--\n/)?.index; },
        tokenizer (src: string) {
          const match = /^--(.*?)--\n([\s\S]+?)\n-- --/.exec(src);
          if (match) {
            return {
              type: "fieldset-block",
              raw: match[0],
              legend: this.lexer.inlineTokens(match[1]),
              content: this.lexer.blockTokens(match[2], [])
            };
          }
        },
        renderer ({ legend, content }) {
          return `<fieldset><legend>${this.parser.parseInline(legend)}</legend>${this.parser.parse(content)}</fieldset>`;
        }
      },
      {
        name: "encrypt-block",
        level: "block",
        start (src: string) { return src.match(/\[encrypt]\n/)?.index; },
        tokenizer (src: string) {
          const match = /^\[encrypt]\n([\s\S]+?)\n\[\/encrypt]/.exec(src);
          if (match) {
            return {
              type: "encrypt-block",
              raw: match[0],
              text: this.lexer.blockTokens(match[1], [])
            };
          }
        },
        renderer ({ text }) {
          return `<div class="encrypt-block">${this.parser.parse(text)}</div>`;
        }
      },
      {
        name: "container-block",
        level: "block",
        start (src: string) { return src.match(/:::/)?.index; },
        tokenizer (src: string) {
          const match = /^^:::\s+(info|tip|warning|danger|details)(?:([ \t\r\f\v]+.+)\n|\s*?\n)([\s\S]+?)\n:::/.exec(src);
          if (match) {
            return {
              type: "container-block",
              raw: match[0],
              cType: match[1],
              title: this.lexer.inlineTokens(match[2]?.trim()),
              content: this.lexer.blockTokens(match[3], [])
            };
          }
        },
        renderer ({ cType, title, content }) {
          title = this.parser.parseInline(title);
          title = title || cType.toUpperCase();

          if (cType === "details") {
            return `<details class="container-block ${cType}">
                      <summary class="container-title">${title}</summary>
                      ${this.parser.parse(content)}
                    </details>`;
          }
          return `<div class="container-block ${cType}">
                    <p class="container-title">${title}</p>
                    ${this.parser.parse(content)}
                  </div>`;
        }
      }
    ]
  });
  const md = marked(text);
  return {
    menu: menuItems,
    md
  };
}

export function afterInsertHtml (mdEl: HTMLElement, forEdit = false, htmlInserted?: Ref<boolean>) {
  const destroyFns: (()=>void)[] = [];
  nextTick(async () => {
    // hljs
    mdEl.querySelectorAll<HTMLElement>("pre>code").forEach(async (el) => {
      const lang = el.parentElement!.querySelector<HTMLElement>(":scope > small")!;
      const language = el.className.replace(/^.*?language-([^ ]+).*?$/, "$1");
      const hljs = initHljs((await import("highlight.js")).default);
      lang.innerText = (hljs.getLanguage(language) || { name: language }).name!;
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
    // copy button and theme button in <pre>
    mdEl.querySelectorAll("pre:not(.processed-pre)").forEach(async (el: Element) => {
      el.classList.add("processed-pre");
      const actions = document.createElement("span");
      el.insertBefore(actions, el.children[0]);
      const themeBtn = createSvgIcon("code-theme", (span) => {
        span.classList.add("code-theme");
        actions.appendChild(span);
      });
      themeBtn.title = "theme";
      themeBtn.onclick = () => toggleCodeBlockTheme();
      const copyBtn = createSvgIcon("copy", (span) => {
        span.classList.add("copy");
        actions.appendChild(span);
      });
      copyBtn.title = "copy";
      const ClipboardJS = (await import("clipboard")).default;
      const clipboard = new ClipboardJS(copyBtn, {
        target: function (trigger) {
          return trigger.parentElement!.parentElement!.querySelector("code")!;
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
    });
    // target=_blank link
    mdEl.querySelectorAll("a[target=_blank]:not(.processed-a)").forEach((el) => {
      el.classList.add("processed-a");
      createSvgIcon("open-link", (span) => {
        span.classList.add("open-link");
        el.appendChild(span);
      });
    });
    const pangu = (await import("pangu")).default;
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
