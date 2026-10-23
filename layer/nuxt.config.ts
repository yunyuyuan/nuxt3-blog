import { hash as cryptoHash } from "crypto";
import { fileURLToPath } from "url";
import postcssNesting from "postcss-nesting";
import { ThemeModeKey } from "./app/utils/common/constants";
import { HeaderTabs } from "./app/utils/common/types";

/** layer 目录下的绝对路径。layer 的配置里不能用 "~/"，它指向站点项目的 app 目录 */
const resolveLayer = (p: string) => fileURLToPath(new URL(p, import.meta.url));

/**
 * 服务端不打包的大依赖。vite 的 SSR 构建默认按“能否从站点根目录解析到”决定是否 external，
 * 结果和包管理器的提升方式有关：用 pnpm 安装本 layer 时，它们从站点根目录解析不到，会被打包，
 * 而 nitro 打包 shiki 的全部语法要 3 GB 以上内存。所以 vite 和 nitro 都固定为 external
 */
const serverExternals = ["monaco-editor", "shiki", "mermaid", "katex"];

/**
 * nuxt3-blog 的框架层（Nuxt layer）。站点项目在 nuxt.config.ts 中 extends 本包，
 * 并在根目录提供 config.ts 和 public/rebuild/ 中的内容。
 * 依赖站点配置的部分（head、主题色、全局常量、预渲染路由）在 modules/blog.ts 中。
 */
export default defineNuxtConfig({
  modules: [
    resolveLayer("./modules/blog"),
    "@nuxtjs/tailwindcss"
  ],
  // #layers/nuxt3-blog 别名的名字。layer 内的代码都通过这个别名互相导入
  $meta: { name: "nuxt3-blog" },
  imports: {
    presets: [
      {
        from: "tailwind-merge",
        imports: ["twMerge"]
      }
    ]
  },

  app: {
    pageTransition: { name: "page", mode: "out-in" },
    head: {
      meta: [
        { charset: "utf-8" }
      ],
      script: [
        // dark mode
        { innerHTML: `(function(){const e=localStorage.getItem("${ThemeModeKey}")||"light";document.documentElement.classList.add(e)})();` }
      ]
    }
  },
  // katex.min.css 随 useMarkdownParser、viewer.css 随 utils/nuxt/viewer.ts 进入详情页和编辑器的 chunk
  css: [resolveLayer("./app/assets/style/main.css")],

  // 由 modules/blog.ts 在构建时填充；这里的初始值用于类型推导
  runtimeConfig: {
    // 仅服务端可见
    nbItemIds: {} as Record<string, number[]>,
    public: {
      stickers: {} as Record<string, number>
    }
  },

  features: {
    inlineStyles: false
  },

  compatibilityDate: "2025-02-15",

  nitro: {
    prerender: {
      crawlLinks: true,
      // 默认不因单个页面出错（如文章里的失效站内链接）而中断博客部署；
      // 本仓库的 CI 设置 NB_PRERENDER_STRICT=true，让模板本身的预渲染错误暴露出来
      failOnError: process.env.NB_PRERENDER_STRICT === "true",
      // /404.html 会被 Nuxt 渲染成 SPA 外壳。GitHub Pages 等静态托管对未知路径返回它，
      // 从而可以直接打开或刷新 /manage/** 等未预渲染的页面
      // 内容页面的路由由 modules/blog.ts 追加
      routes: ["/404.html"],
      ignore: ["/manage"]
    },
    cloudflare: {
      pages: {
        routes: {
          exclude: HeaderTabs.map(tab => `${tab}/*`)
        }
      }
    },
    rollupConfig: {
      external: serverExternals
    }
  },

  vite: {
    // 开发模式的写入插件和 define（__NB_*__ 常量）由 modules/blog.ts 注册
    optimizeDeps: {
      exclude: ["monaco-editor"]
    },
    ssr: {
      // 只 external shiki 而打包它的子包 @shikijs/*（或反过来）时，rollup 会为 shiki/wasm
      // 生成非法代码 _mergeNamespaces({ default: default })。ssr.external 会连同传递依赖一起 external
      external: serverExternals
    },
    css: {
      modules: {
        generateScopedName: (name, css) => {
          if (name === "dark") return "dark";
          const hash = cryptoHash("sha1", css).substring(0, 5);

          return `_${name}_${hash}`;
        }
      }
    }
  },

  postcss: {
    plugins: {
      "postcss-import": {},
      // 传入插件本身而不是包名：传包名时 tailwindcss 会从它自己的安装目录 require，
      // 而 postcss-nesting 是本 layer 的依赖，pnpm 不一定把它放在 tailwindcss 能找到的位置
      "tailwindcss/nesting": postcssNesting,
      "tailwindcss": {},
      "autoprefixer": {}
    }
  },

  tailwindcss: {
    exposeConfig: true,
    // @nuxtjs/tailwindcss 生成的 .nuxt/tailwind/postcss.mjs 按包名导入 @nuxtjs/tailwindcss，
    // 从站点目录解析。所以站点要平铺安装依赖（pnpm 用 shamefully-hoist 或 node-linker=hoisted）
    cssPath: resolveLayer("./app/assets/style/tailwind.css")
  }
});
