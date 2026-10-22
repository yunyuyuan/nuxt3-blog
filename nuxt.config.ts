import { hash as cryptoHash } from "crypto";
import type { AppHeadMetaObject } from "@nuxt/schema";
import { withBase } from "ufo";
import config from "./config";
import { allPlugins, buildPlugins } from "./vite-plugins";
import { ThemeModeKey } from "./app/utils/common/constants";
import { HeaderTabs } from "./app/utils/common/types";

// 读取内容、git 信息、生成主题色和 feed 等构建期逻辑在 modules/blog.ts 中
const isDev = process.env.NODE_ENV === "development";
const baseURL = process.env.NUXT_APP_BASE_URL || "/";

const scripts: AppHeadMetaObject["script"] = [];
// dark mode
scripts.push({
  innerHTML: `(function(){const e=localStorage.getItem("${ThemeModeKey}")||"light";document.documentElement.classList.add(e)})();`
});
// random theme
scripts.push({
  innerHTML: `(function(){let e=${JSON.stringify(config.themeColor)};if(e.length<2)return;let t=Math.floor(Math.random()*e.length),l=e[t],n=document.documentElement;e.forEach(e=>{n.classList.remove(\`theme-\${e}\`)}),n.classList.add(\`theme-\${l}\`)})();`
});

if (!isDev) {
  const cfAnalyzeId = config.CloudflareAnalyze;
  const msAnalyzeId = config.MSClarityId;
  if (cfAnalyzeId) {
    scripts.push({
      "src": "https://static.cloudflareinsights.com/beacon.min.js",
      "async": false,
      "defer": true,
      "data-cf-beacon": `{"token": "${cfAnalyzeId}"}`
    });
  }
  if (msAnalyzeId) {
    scripts.push({
      innerHTML: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${msAnalyzeId}");`
    });
  }
}

// const prefix = "monaco-editor/esm/vs";
// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  modules: [
    "@nuxt/eslint",
    "@nuxt/devtools",
    "@nuxt/test-utils/module",
    "@nuxtjs/tailwindcss"
  ],
  imports: {
    presets: [
      {
        from: "tailwind-merge",
        imports: ["twMerge"]
      }
    ]
  },
  devtools: { enabled: true },

  app: {
    pageTransition: { name: "page", mode: "out-in" },
    head: {
      meta: [
        { charset: "utf-8" },
        { name: "keywords", content: config.SEO_keywords },
        { name: "author", content: config.nickName }
      ],
      link: [
        { rel: "shortcut icon", href: withBase("/icon.png", baseURL) },
        { rel: "alternate", type: "application/rss+xml", title: config.title, href: withBase("/rss.xml", baseURL) }
      ],
      script: scripts,
      title: config.title
    }
  },
  // katex.min.css 随 useMarkdownParser、viewer.css 随 utils/nuxt/viewer.ts 进入详情页和编辑器的 chunk
  css: ["~/assets/style/main.css"],

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
      external: ["monaco-editor", "shiki", "mermaid", "katex"]
    }
  },

  vite: {
    plugins: isDev ? allPlugins : buildPlugins,
    optimizeDeps: {
      exclude: ["monaco-editor"]
    },
    // define（__NB_*__ 常量）由 modules/blog.ts 注入
    css: {
      modules: {
        generateScopedName: (name, css) => {
          if (name === "dark") return "dark";
          const hash = cryptoHash("sha1", css).substring(0, 5);

          return `_${name}_${hash}`;
        }
      }
    },
    build: {
      // minify: false
    }
  },

  postcss: {
    plugins: {
      "postcss-import": {},
      "tailwindcss/nesting": "postcss-nesting",
      "tailwindcss": {},
      "autoprefixer": {}
    }
  },
  telemetry: false,

  eslint: {
    config: {
      stylistic: {
        quotes: "double",
        commaDangle: "never",
        semi: true,
        braceStyle: "1tbs"
      }
    }
  },
  tailwindcss: {
    exposeConfig: true,
    cssPath: "~/assets/style/tailwind.css"
  }
});
