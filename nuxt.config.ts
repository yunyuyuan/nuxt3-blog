import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { defineNuxtConfig } from "nuxt";
import { Plugin } from "vite";
import { dataToEsm } from "rollup-pluginutils";
import config from "./config";
import { getNowDayjs } from "./utils/_dayjs";
import genRss from "./rss";
import localServer from "./local-server";

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
const stickers = {};
fs.readdirSync("./public/sticker").forEach((dir) => {
  stickers[dir] = fs.readdirSync(`./public/sticker/${dir}`).length;
});

const scripts = [];
if (config.CloudflareAnalyze) {
  scripts.push({
    src: "https://static.cloudflareinsights.com/beacon.min.js",
    async: false,
    defer: true,
    "data-cf-beacon": `{"token": "${config.CloudflareAnalyze}"}`
  });
}

// const prefix = "monaco-editor/esm/vs";
// https://v3.nuxtjs.org/docs/directory-structure/nuxt.config
export default defineNuxtConfig({
  telemetry: false,
  target: "static",
  ssr: false,
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
        { rel: "shortcut icon", href: "/favicon.jpg" }
      ],
      script: scripts,
      title: config.title
    }
  },
  css: ["~/assets/style/main.scss"],
  runtimeConfig: {
    public: {
      stickers,
      dev: process.env.NODE_ENV === "development"
    },
    app: {
      NUXT_ENV_CURRENT_GIT_SHA: execSync("git rev-parse HEAD").toString().trim()
    }
  },
  nitro: {
    output: { dir: "{{ rootDir }}/.output", serverDir: "{{ output.dir }}/server", publicDir: "{{ output.dir }}/public" }
  },
  hooks: {
    // why this don't work?
    // "generate:done": () => {
    close: () => {
      // TODO move to gulp
      const distDir = "./.output/public";
      fs.writeFileSync(path.resolve(__dirname, `${distDir}/sitemap.xml`),
        genRss(JSON.parse(fs.readFileSync(path.resolve(__dirname, "./public/rebuild/json/articles.json")).toString())));
      fs.writeFileSync(path.resolve(__dirname, `${distDir}/timestamp.txt`), getNowDayjs().format("YYYY-MM-DD HH:mm:ss"));
    }
  },
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  vite: {
    plugins: [rawLoaderPlugin, localServer],
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
