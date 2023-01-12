import fs from "fs";
import { execSync } from "child_process";
import type { Plugin } from "vite";
import { dataToEsm } from "rollup-pluginutils";
import config from "./config";
import devServerPlugins from "./dev-server";

const isDev = process.env.NODE_ENV === "development";

const rawLoaderPlugin: Plugin = {
  name: "raw-file-loader",
  transform (_: string, filepath: string) {
    if (filepath.includes("node_modules")) {
      return null;
    }
    if (filepath.endsWith(".svg")) {
      return {
        code: dataToEsm(fs.readFileSync(filepath).toString())
      };
    }
  }
};

// themeColor
fs.writeFileSync("./assets/style/_theme.scss", `$theme: ${config.themeColor};`);

// stickers
const stickers: Record<string, any> = {};
fs.readdirSync("./public/sticker").forEach((dir) => {
  stickers[dir] = fs.readdirSync(`./public/sticker/${dir}`).length;
});

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

// const prefix = "monaco-editor/esm/vs";
// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  telemetry: false,
  ssr: !isDev,
  app: {
    head: {
      htmlAttrs: {
        lang: "zh-cn"
      },
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
        },
        { name: "description", content: config.SEO_description },
        { name: "keywords", content: config.SEO_keywords }
      ],
      link: [
        { rel: "shortcut icon", href: "/favicon.png" }
      ],
      script: scripts,
      title: config.title
    }
  },
  css: ["~/assets/style/main.scss"],
  runtimeConfig: {
    public: {
      stickers,
      timestamp
    },
    app: {
      NUXT_ENV_CURRENT_GIT_SHA: execSync("git rev-parse HEAD").toString().trim(),
      mongoDBEnabled: !!process.env.MONGODB_URI,
      cmtRepId: config.CommentRepoId || process.env.CommentRepoId,
      cmtRepCateId: config.CommentDiscussionCategoryId || process.env.CommentDiscussionCategoryId
    }
  },
  nitro: {
    output: { dir: "{{ rootDir }}/.output", serverDir: "{{ output.dir }}/server", publicDir: "{{ output.dir }}/public" },
    prerender: {
      ignore: ["/manage"]
    }
  },
  experimental: {
    payloadExtraction: false
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  vite: {
    plugins: [rawLoaderPlugin, ...devServerPlugins],
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
