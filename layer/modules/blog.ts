import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { addTemplate, addTypeTemplate, addVitePlugin, defineNuxtModule, useLogger } from "@nuxt/kit";
import type { Nuxt } from "@nuxt/schema";
// 引入 @nuxtjs/tailwindcss 对 NuxtHooks 的类型扩展（tailwindcss:config）
import type {} from "@nuxtjs/tailwindcss";
import type { NitroRouteConfig } from "nitropack";
import colors from "tailwindcss/colors";
import { withBase } from "ufo";
import { generateFeeds, themeColorsCSS, uploadAlgoliaIndex } from "../scripts/nuxt-hooks";
import { loadBlogConfig, setBlogContext } from "../scripts/utils/context";
import { rebuild } from "../vite-plugins";
import type { BlogConfig } from "../app/utils/common/blog-config";
import { getNowDayjsString } from "../app/utils/common/dayjs";
import { HeaderTabs, type CommonItem } from "../app/utils/common/types";

/** layer 的根目录（本文件在 <layer>/modules 下） */
const layerDir = path.resolve(__dirname, "..");

/**
 * 取第一个有值的环境变量；都没有时再执行 git 命令。
 * 不是 git 仓库（例如下载的源码压缩包）时返回空串，不让构建失败。
 */
function gitInfo(envValues: (string | undefined)[], command: string, cwd: string) {
  const fromEnv = envValues.find(v => !!v);
  if (fromEnv) {
    return fromEnv;
  }
  try {
    return execSync(command, { cwd, stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

/** layer 的 public/sticker 下每个表情包的图片数 */
function readStickers() {
  const dir = path.join(layerDir, "public/sticker");
  const stickers: Record<string, number> = {};
  for (const name of fs.readdirSync(dir)) {
    stickers[name] = fs.readdirSync(path.join(dir, name)).length;
  }
  return stickers;
}

/** 从内容 JSON 得到预渲染路由、customSlug 的重定向规则，以及每个栏目的条目 id */
function collectContent(rootDir: string, isTest: boolean, baseURL: string) {
  const routes: string[] = [];
  const routeRules: Record<string, NitroRouteConfig> = {};
  // 访客统计接口用它拒绝不存在的条目
  const itemIds: Record<string, number[]> = {};
  for (const url of HeaderTabs) {
    const file = path.join(rootDir, `public${isTest ? "/e2e" : ""}/rebuild/json${url}.json`);
    if (!fs.existsSync(file)) {
      continue;
    }
    const list = JSON.parse(fs.readFileSync(file).toString()) as CommonItem[];
    itemIds[url] = list.map(item => item.id);
    for (const item of list) {
      if (item.customSlug) {
        // Nitro 不会给重定向目标补 baseURL，这里自己加上。
        // id 地址也参与预渲染：Nitro 会把重定向写成 meta refresh 页面，静态托管上旧链接依然可用。
        routeRules[`${url}/${item.id}`] = { redirect: { to: withBase(`${url}/${item.customSlug}`, baseURL) } };
        routes.push(`${url}/${item.id}`);
      }
      routes.push(`${url}/${item.customSlug || item.id}`);
    }
  }
  return { routes, routeRules, itemIds };
}

/**
 * 当前版本号：layer 的 package.json 中 version 的主版本号。
 * 后台把它和上游 CHANGELOG.md 中第一个 ## [vN] 的 N 比较，提示升级。
 */
function readCurrentVersion() {
  const pkg = JSON.parse(fs.readFileSync(path.join(layerDir, "package.json")).toString()) as { version?: string };
  return pkg.version?.split(".")[0] || "1";
}

/** 依赖站点配置的 head 内容：标题、关键词、作者、图标、RSS 链接、随机主题色和统计脚本 */
function addHead(nuxt: Nuxt, config: BlogConfig, baseURL: string) {
  const head = nuxt.options.app.head;
  head.title ||= config.title;
  head.meta = [
    ...(head.meta ?? []),
    { name: "keywords", content: config.SEO_keywords },
    { name: "author", content: config.nickName }
  ];
  head.link = [
    ...(head.link ?? []),
    { rel: "shortcut icon", href: withBase("/icon.png", baseURL) },
    { rel: "alternate", type: "application/rss+xml", title: config.title, href: withBase("/rss.xml", baseURL) }
  ];
  const scripts = [...(head.script ?? [])];
  // 随机主题色：在 layer 的夜间模式脚本之后执行
  scripts.push({
    innerHTML: `(function(){let e=${JSON.stringify(config.themeColor)};if(e.length<2)return;let t=Math.floor(Math.random()*e.length),l=e[t],n=document.documentElement;e.forEach(e=>{n.classList.remove(\`theme-\${e}\`)}),n.classList.add(\`theme-\${l}\`)})();`
  });
  head.script = scripts;
  // 统计脚本只在生产构建中加入
  if (nuxt.options.dev) {
    return;
  }
  if (config.CloudflareAnalyze) {
    scripts.push({
      "src": "https://static.cloudflareinsights.com/beacon.min.js",
      "async": false,
      "defer": true,
      "data-cf-beacon": `{"token": "${config.CloudflareAnalyze}"}`
    });
  }
  if (config.MSClarityId) {
    scripts.push({
      innerHTML: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window, document, "clarity", "script", "${config.MSClarityId}");`
    });
  }
}

/**
 * 博客的构建期逻辑：读取站点配置、内容和仓库信息，注入全局常量，注册构建钩子。
 * 本模块属于 layer。站点的文件（config.ts、public/rebuild）都从 nuxt.options.rootDir 读取，
 * 框架自带的文件（表情包、版本号）从 layer 目录读取。
 */
export default defineNuxtModule({
  meta: { name: "nuxt3-blog" },
  async setup(_, nuxt) {
    const logger = useLogger("nuxt3-blog");
    const rootDir = nuxt.options.rootDir;
    const isTest = process.env.VITESTING === "true";
    const baseURL = nuxt.options.app.baseURL || "/";

    const config = await loadBlogConfig(rootDir);
    setBlogContext({ rootDir, config });

    addHead(nuxt, config, baseURL);

    // 主题色写到 buildDir，不写入源码目录：layer 作为 npm 包安装时位于 node_modules 中
    const themeColors = addTemplate({
      filename: "nuxt3-blog/theme-colors.css",
      getContents: () => themeColorsCSS(config.themeColor),
      write: true
    });
    nuxt.options.css.push(themeColors.dst);
    // 夜间模式色板来自站点配置。注入 tailwind 的颜色对象，"dark-500/30" 这类透明度写法依然可用
    nuxt.hook("tailwindcss:config", (tailwindConfig) => {
      tailwindConfig.theme ??= {};
      tailwindConfig.theme.extend ??= {};
      tailwindConfig.theme.extend.colors = {
        ...(tailwindConfig.theme.extend.colors as Record<string, unknown> | undefined),
        dark: colors[config.themeColorDark as keyof typeof colors]
      };
    });

    // 开发模式的“提交”写入站点目录
    if (nuxt.options.dev) {
      addVitePlugin(rebuild(rootDir));
    }

    const { routes, routeRules, itemIds } = collectContent(rootDir, isTest, baseURL);
    nuxt.options.routeRules = { ...routeRules, ...nuxt.options.routeRules };
    nuxt.options.nitro.prerender ||= {};
    nuxt.options.nitro.prerender.routes = [...(nuxt.options.nitro.prerender.routes ?? []), ...routes];
    // Nuxt 按实际值生成 runtimeConfig 的类型（键是栏目和表情包名），这里按目标类型赋值
    nuxt.options.runtimeConfig.nbItemIds = itemIds as typeof nuxt.options.runtimeConfig.nbItemIds;
    nuxt.options.runtimeConfig.public.stickers = readStickers() as typeof nuxt.options.runtimeConfig.public.stickers;

    // 注入到前端代码的常量。类型声明由同一张表生成，二者不会不一致
    const defines = {
      __NB_DATABASE_ENABLED__: !!process.env.CLOUDFLARE_D1_TOKEN && !!process.env.CLOUDFLARE_D1_ACCOUNT_ID && !!process.env.CLOUDFLARE_D1_DATABASE_ID,
      __NB_CMTREPOID__: config.CommentRepoId,
      __NB_CMTREPOCATEID__: config.CommentDiscussionCategoryId,
      __NB_ALGOLIA_APP_ID__: config.algoliaSearch.appId,
      __NB_ALGOLIA_SEARCH_KEY__: config.algoliaSearch.searchKey,
      __NB_ALGOLIA_INDEX_NAME__: config.algoliaSearch.indexName,
      __NB_ALGOLIA_ENABLED__: !!config.algoliaSearch.appId && !!config.algoliaSearch.searchKey && !!config.algoliaSearch.indexName,
      __NB_BUILD_TIME__: getNowDayjsString(),
      __NB_GITHUB_REPO__: config.githubRepo,
      __NB_GIT_BRANCH__: gitInfo([
        process.env.VERCEL_GIT_COMMIT_REF,
        process.env.CF_PAGES_BRANCH,
        // netlify
        process.env.BRANCH
      ], "git rev-parse --abbrev-ref HEAD", rootDir) || "main",
      __NB_CURRENT_GIT_SHA__: gitInfo([
        process.env.VERCEL_GIT_COMMIT_SHA,
        process.env.CF_PAGES_COMMIT_SHA,
        // netlify
        process.env.COMMIT_REF
      ], "git rev-parse HEAD", rootDir),
      __NB_BUILDTIME_VITESTING__: isTest,
      __NB_CURRENT_VERSION__: readCurrentVersion(),
      __NB_BASE_URL__: baseURL
    } satisfies Record<string, string | boolean>;

    nuxt.options.vite.define = {
      ...nuxt.options.vite.define,
      ...Object.fromEntries(Object.entries(defines).map(([key, value]) => [key, JSON.stringify(value)]))
    };
    addTypeTemplate({
      filename: "types/nuxt3-blog-defines.d.ts",
      getContents: () => [
        "// Generated by modules/blog.ts from the same values as vite.define",
        "declare global {",
        ...Object.entries(defines).map(([key, value]) => `  const ${key}: ${typeof value};`),
        "}",
        "export {};",
        ""
      ].join("\n")
    });

    nuxt.hook("nitro:build:public-assets", async (nitro) => {
      const publicDir = nitro.options.output.publicDir;
      generateFeeds(publicDir);
      if (isTest) {
        return;
      }
      // 等待上传完成；失败只记录错误，不中断部署，搜索索引会保持上一次的内容
      try {
        await uploadAlgoliaIndex();
      } catch (error) {
        logger.error("Algolia index upload failed. The site still deploys; the search index is not updated.", error);
      }
      fs.rmSync(path.join(publicDir, "e2e"), { recursive: true, force: true });
    });
  }
});
