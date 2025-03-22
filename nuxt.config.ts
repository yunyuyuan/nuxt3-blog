import path from "path";
import fs from "fs";
import { execSync } from "child_process";
import { hash as cryptoHash } from "crypto";
import { generateSiteMap, generateThemeColorsCSS, uploadAlgoliaIndex } from "./scripts/nuxt-hooks";
import config from "./config";
import { allPlugins, buildPlugins } from "./vite-plugins";
import { getNowDayjsString } from "./utils/common/dayjs";
import { ThemeModeKey } from "./utils/common/constants";
import { HeaderTabs, type CommonItem } from "./utils/common/types";

const isDev = process.env.NODE_ENV === "development";
const isTest = process.env.VITESTING === "true";

// stickers
const stickers: Record<string, any> = {};
fs.readdirSync("./public/sticker").forEach((dir) => {
  stickers[dir] = fs.readdirSync(`./public/sticker/${dir}`).length;
});

// random theme
generateThemeColorsCSS();

const scripts = [];
// dark mode
scripts.push(`(function(){const e=localStorage.getItem("${ThemeModeKey}")||"light";document.documentElement.classList.add(e)})();`);
// random theme
scripts.push(`(function(){let e=${JSON.stringify(config.themeColor)};if(e.length<2)return;let t=Math.floor(Math.random()*e.length),l=e[t],n=document.documentElement;e.forEach(e=>{n.classList.remove(\`theme-\${e}\`)}),n.classList.add(\`theme-\${l}\`)})();`);

if (!isDev) {
  const cfAnalyzeId = config.CloudflareAnalyze || process.env.CloudflareAnalyze;
  const msAnalyzeId = config.MSClarityId || process.env.MSClarityId;
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
      children: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${msAnalyzeId}");`
    });
  }
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
        HeaderTabs.forEach((url) => {
          const path = `./public${isTest ? "/e2e" : ""}/rebuild/json${url}.json`;
          if (fs.existsSync(path)) {
            const json = JSON.parse(fs.readFileSync(path).toString()) as CommonItem[];
            json.forEach((item) => {
              // if (!item.encrypt) {
              routes.push(`${url}/${item.id}`);
              // }
            });
          }
        });
        return routes;
      })(),
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
      external: ["monaco-editor"]
    }
  },

  vite: {
    plugins: isDev ? allPlugins : buildPlugins,
    define: {
      __NB_DATABASE_ENABLED__: !!import.meta.env.CLOUDFLARE_D1_TOKEN && !!import.meta.env.CLOUDFLARE_D1_ACCOUNT_ID && !!import.meta.env.CLOUDFLARE_D1_DATABASE_ID,
      __NB_CMTREPOID__: JSON.stringify(config.CommentRepoId || import.meta.env.CommentRepoId),
      __NB_CMTREPOCATEID__: JSON.stringify(config.CommentDiscussionCategoryId || import.meta.env.CommentDiscussionCategoryId),
      __NB_ALGOLIA_APP_ID: JSON.stringify(process.env.ALGOLIA_APP_ID || config.algoliaSearch.appId),
      __NB_ALGOLIA_SEARCH_KEY: JSON.stringify(process.env.ALGOLIA_SEARCH_KEY || config.algoliaSearch.searchKey),
      __NB_ALGOLIA_INDEX_NAME: JSON.stringify(process.env.ALGOLIA_INDEX_NAME || config.algoliaSearch.indexName),
      __NB_BUILD_TIME__: JSON.stringify(getNowDayjsString()),
      __NB_CURRENT_GIT_SHA__: JSON.stringify(execSync("git rev-parse HEAD").toString().trim()),
      __NB_BUILDTIME_VITESTING__: isTest
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
    "nitro:build:public-assets"(nitro) {
      generateSiteMap(nitro.options.output.publicDir);
      if (!isTest) {
        uploadAlgoliaIndex();
        fs.rmSync(path.join(nitro.options.output.publicDir, "e2e"), { recursive: true });
      }
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
