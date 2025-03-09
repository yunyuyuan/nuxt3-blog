import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { hash as cryptoHash } from "crypto";
import { generateSiteMap } from "./scripts/generate";
import config from "./config";
import { allPlugins, buildPlugins } from "./vite-plugins";
import { getNowDayjsString } from "./utils/common/dayjs";
import { ThemeModeKey } from "./utils/common/constants";
import { HeaderTabs, type CommonItem } from "./utils/common/types";

const isDev = process.env.NODE_ENV === "development";

// stickers
const stickers: Record<string, any> = {};
fs.readdirSync("./public/sticker").forEach((dir) => {
  stickers[dir] = fs.readdirSync(`./public/sticker/${dir}`).length;
});

const scripts = [];
scripts.push(`(function(){const e=localStorage.getItem("${ThemeModeKey}")||"light";document.documentElement.classList.add(e)})();`);
const cfAnalyzeId = config.CloudflareAnalyze || process.env.CloudflareAnalyze;
const msAnalyzeId = config.MSClarityId || process.env.MSClarityId;
if (cfAnalyzeId && !isDev) {
  scripts.push({
    "src": "https://static.cloudflareinsights.com/beacon.min.js",
    "async": false,
    "defer": true,
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
  modules: [
    "@nuxt/eslint",
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
  devtools: { enabled: false },

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
  css: ["~/assets/style/main.css", "~/node_modules/katex/dist/katex.min.css", "~/node_modules/viewerjs/dist/viewer.css"],

  runtimeConfig: {
    public: {
      stickers
    },
    app: {
      githubBranch
    }
  },

  features: {
    inlineStyles: false
  },

  experimental: {
    payloadExtraction: false
  },
  compatibilityDate: "2025-02-15",

  nitro: {
    prerender: {
      crawlLinks: true,
      failOnError: false,
      routes: (() => {
        const routes: string[] = [];
        HeaderTabs.forEach(({ url }) => {
          const json = JSON.parse(fs.readFileSync(`./public/rebuild/json${url}.json`).toString()) as CommonItem[];
          json.forEach((item) => {
            // if (!item.encrypt) {
            routes.push(`${url}/${item.id}`);
            // }
          });
        });
        return routes;
      })(),
      ignore: ["/manage"]
    },
    rollupConfig: {
      external: ["monaco-editor"]
    }
  },

  vite: {
    plugins: isDev ? allPlugins : buildPlugins,
    define: {
      __NB_MONGODB_ENABLED__: !!import.meta.env.MONGODB_URI || !!import.meta.env.MONGODB_USER,
      __NB_COMMENTING_ENABLED__: !!(config.CommentRepoId || import.meta.env.CommentRepoId) && !!(config.CommentDiscussionCategoryId || import.meta.env.CommentDiscussionCategoryId),
      __NB_BUILD_TIME__: JSON.stringify(getNowDayjsString()),
      __NB_CURRENT_GIT_SHA__: JSON.stringify(execSync("git rev-parse HEAD").toString().trim()),
      __NB_VITESTING__: process.env.VITESTING === "true"
    },
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

  hooks: {
    "vite:extendConfig"(config, { isClient }) {
      if (isClient) {
        (config.build?.rollupOptions?.output as any).manualChunks = {
          // markdown: ["highlight.js", "katex", "marked"]
        };
      }
    },
    "nitro:build:before"(nitro) {
      const apiPath = path.join(__dirname, "utils", "api");
      if (["node-server"].includes(nitro.options.preset) && !!import.meta.env.MONGODB_URI) {
        for (const file of fs.readdirSync(path.join(apiPath, "db-tcp"))) {
          fs.renameSync(path.join(apiPath, "db-tcp", file), path.join(apiPath, "db", file));
        }
      }
    },
    "nitro:build:public-assets"(nitro) {
      generateSiteMap(nitro.options.output.publicDir);
      fs.rmSync(path.join(nitro.options.output.publicDir, "e2e"), { recursive: true });
    }
  },

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
