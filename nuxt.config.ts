import fs from "fs";
import { execSync } from "child_process";
import config from "./config";
import { allPlugins, buildPlugins } from "./vite-plugins";
import { i18nLocales } from "./utils/common";

const isDev = process.env.NODE_ENV === "development";

// themeColor
fs.writeFileSync("./assets/style/_theme.scss", `$theme: ${config.themeColor};`);

// stickers
const stickers: Record<string, any> = {};
fs.readdirSync("./public/sticker").forEach((dir) => {
  stickers[dir] = fs.readdirSync(`./public/sticker/${dir}`).length;
});

// svgs
const svgs = fs.readdirSync("./assets/svg").map(file => file.replace(/\.svg$/, ""));

const scripts = [];
const analyzeId = config.CloudflareAnalyze || process.env.CloudflareAnalyze;
if (analyzeId && !isDev) {
  scripts.push({
    src: "https://static.cloudflareinsights.com/beacon.min.js",
    async: false,
    defer: true,
    "data-cf-beacon": `{"token": "${analyzeId}"}`
  });
}

const timestamp = Date.now();

let githubBranch = "main";
for (const b of [
  // vercel
  process.env.VERCEL_GIT_COMMIT_REF,
  // cloudflare page
  process.env.CF_PAGES_BRANCH,
  // XXX Why `git rev-parse --abbrev-ref HEAD` not works as expected?
  // git cli for fallback
  execSync("git rev-parse --abbrev-ref HEAD").toString().trim()
]) {
  if (b) {
    githubBranch = b;
    break;
  }
}

// const prefix = "monaco-editor/esm/vs";
// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  telemetry: false,
  ssr: !isDev,
  app: {
    head: {
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
        },
        { name: "description", content: config.SEO_description },
        { name: "keywords", content: config.SEO_keywords },
        { name: "author", content: config.nickName }
      ],
      link: [
        { rel: "shortcut icon", href: "/icon.png" }
      ],
      script: scripts,
      title: config.title
    }
  },
  css: ["~/assets/style/main.scss", "~/node_modules/katex/dist/katex.min.css"],
  runtimeConfig: {
    public: {
      stickers,
      svgs: isDev ? svgs : [],
      timestamp
    },
    app: {
      NUXT_ENV_CURRENT_GIT_SHA: execSync("git rev-parse HEAD").toString().trim(),
      githubBranch,
      mongoDBEnabled: !!process.env.MONGODB_URI,
      cmtRepId: config.CommentRepoId || process.env.CommentRepoId,
      cmtRepCateId: config.CommentDiscussionCategoryId || process.env.CommentDiscussionCategoryId
    }
  },
  nitro: {
    output: { dir: "{{ rootDir }}/.output", serverDir: "{{ output.dir }}/server", publicDir: "{{ output.dir }}/public" }
  },
  modules: [
    "@nuxtjs/i18n"
  ],
  i18n: {
    strategy: "prefix_except_default",
    baseUrl: config.domain,
    locales: i18nLocales.map(item => ({
      code: item.code,
      file: item.file,
      iso: item.iso
    })),
    lazy: true,
    langDir: "i18n",
    defaultLocale: config.defaultLang,
    vueI18n: {
      fallbackLocale: config.defaultLang
    }
  },
  experimental: {
    /**
     * Need payload to cache the data from useAsyncData, but why?
     * https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/plugins/payload.client.ts#L27
     */
    // payloadExtraction: false
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  vite: {
    plugins: isDev ? allPlugins : buildPlugins,
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: "@use 'sass:math';@import 'assets/style/var';"
        }
      }
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            // jsonWorker: [`${prefix}/language/json/json.worker`],
            // cssWorker: [`${prefix}/language/css/css.worker`],
            // htmlWorker: [`${prefix}/language/html/html.worker`],
            // tsWorker: [`${prefix}/language/typescript/ts.worker`],
            // editorWorker: [`${prefix}/editor/editor.worker`],
          }
        }
      }
    }
  }
});
