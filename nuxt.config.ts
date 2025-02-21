import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { generateSiteMap } from "./scripts/generate";
import config from "./config";
import { allPlugins, buildPlugins } from "./vite-plugins";
import { getNowDayjsString } from "./utils/common";

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
const cfAnalyzeId = config.CloudflareAnalyze || process.env.CloudflareAnalyze;
const msAnalyzeId = config.MSClarityId || process.env.MSClarityId;
if (cfAnalyzeId && !isDev) {
  scripts.push({
    src: "https://static.cloudflareinsights.com/beacon.min.js",
    async: false,
    defer: true,
    "data-cf-beacon": `{"token": "${cfAnalyzeId}"}`
  });
}
if (msAnalyzeId && !isDev) {
  scripts.push({
    children: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${msAnalyzeId}");`
  });
}

let githubBranch = "main";
for (const b of [
  // vercel
  process.env.VERCEL_GIT_COMMIT_REF,
  // cloudflare page
  process.env.CF_PAGES_BRANCH,
  // netlify
  process.env.BRANCH,
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
  devtools: { enabled: false },
  telemetry: false,

  app: {
    head: {
      meta: [
        { charset: "utf-8" },
        {
          name: "viewport",
          content: "width=device-width,initial-scale=1,minimum-scale=1,maximum-scale=1,user-scalable=no"
        },
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

  css: ["~/assets/style/main.scss", "~/node_modules/katex/dist/katex.min.css", "~/node_modules/viewerjs/dist/viewer.css"],
  modules: [
    "@nuxt/eslint",
    "@nuxt/test-utils/module"
  ],

  runtimeConfig: {
    public: {
      stickers,
      svgs: isDev ? svgs : []
    },
    app: {
      NUXT_ENV_CURRENT_GIT_SHA: execSync("git rev-parse HEAD").toString().trim(),
      githubBranch
    }
  },

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      ignore: ["/manage"]
    },
    cloudflare: {
      pages: {
        routes: {
          include: ["/api/*"]
        }
      }
    }
  },

  experimental: {
    /**
     * Need payload to cache the data from useAsyncData, but why?
     * https://github.com/nuxt/nuxt/blob/main/packages/nuxt/src/app/plugins/payload.client.ts#L27
     */
    // payloadExtraction: false
    inlineSSRStyles: false,
  },

  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  vite: {
    plugins: isDev ? allPlugins : buildPlugins,
    define: {
      __NB_MONGODB_ENABLED__: !!import.meta.env.MONGODB_URI || !!import.meta.env.MONGODB_USER,
      __NB_COMMENTING_ENABLED__: !!(config.CommentRepoId || import.meta.env.CommentRepoId) && !!(config.CommentDiscussionCategoryId || import.meta.env.CommentDiscussionCategoryId),
      __NB_BUILD_TIME__: JSON.stringify(getNowDayjsString())
    },
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use 'sass:math';
            @use 'sass:color';
            @use '@/assets/style/var' as *;
          `
        }
      }
    },
    build: {
      // minify: false
    }
  },

  hooks: {
    "vite:extendConfig" (config, { isClient }) {
      if (isClient) {
        (config.build?.rollupOptions?.output as any).manualChunks = {
          // markdown: ["highlight.js", "katex", "marked"]
        };
      }
    },
    "nitro:build:before" (nitro) {
      const apiPath = path.join(__dirname, "utils", "api");
      if (["node-server"].includes(nitro.options.preset)) {
        for (const file of fs.readdirSync(path.join(apiPath, "db-tcp"))) {
          fs.renameSync(path.join(apiPath, "db-tcp", file), path.join(apiPath, "db", file));
        }
      }
    },
    "nitro:build:public-assets" (nitro) {
      generateSiteMap(nitro.options.output.publicDir);
    }
  },

  compatibilityDate: "2025-02-15"
});