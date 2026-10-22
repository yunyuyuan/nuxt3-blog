import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import { addTypeTemplate, defineNuxtModule, useLogger } from "@nuxt/kit";
import type { NitroRouteConfig } from "nitropack";
import { withBase } from "ufo";
import config from "../config";
import { generateFeeds, generateThemeColorsCSS, uploadAlgoliaIndex } from "../scripts/nuxt-hooks";
import { getNowDayjsString } from "../app/utils/common/dayjs";
import { HeaderTabs, type CommonItem } from "../app/utils/common/types";

/**
 * 取第一个有值的环境变量；都没有时再执行 git 命令。
 * 不是 git 仓库（例如下载的源码压缩包）时返回空串，不让构建失败。
 */
function gitInfo(envValues: (string | undefined)[], command: string) {
  const fromEnv = envValues.find(v => !!v);
  if (fromEnv) {
    return fromEnv;
  }
  try {
    return execSync(command, { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return "";
  }
}

/** public/sticker 下每个表情包的图片数 */
function readStickers(rootDir: string) {
  const dir = path.join(rootDir, "public/sticker");
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

/** CHANGELOG.md 中第一个 ## [vN] 的 N */
function readCurrentVersion(rootDir: string) {
  const changelog = fs.readFileSync(path.join(rootDir, "CHANGELOG.md")).toString();
  return changelog.match(/##\s*\[v(\d+)\]/)?.[1] ?? "1";
}

/**
 * 博客的构建期逻辑：读取内容和仓库信息、注入全局常量、注册构建钩子。
 * 以前这些代码在 nuxt.config.ts 顶层执行，任何读取配置的命令都会触发。
 */
export default defineNuxtModule({
  meta: { name: "nuxt3-blog" },
  setup(_, nuxt) {
    const logger = useLogger("nuxt3-blog");
    const rootDir = nuxt.options.rootDir;
    const isTest = process.env.VITESTING === "true";
    const baseURL = nuxt.options.app.baseURL || "/";

    generateThemeColorsCSS();

    const { routes, routeRules, itemIds } = collectContent(rootDir, isTest, baseURL);
    nuxt.options.routeRules = { ...routeRules, ...nuxt.options.routeRules };
    nuxt.options.nitro.prerender ||= {};
    nuxt.options.nitro.prerender.routes = [...(nuxt.options.nitro.prerender.routes ?? []), ...routes];
    // Nuxt 按实际值生成 runtimeConfig 的类型（键是栏目和表情包名），这里按目标类型赋值
    nuxt.options.runtimeConfig.nbItemIds = itemIds as typeof nuxt.options.runtimeConfig.nbItemIds;
    nuxt.options.runtimeConfig.public.stickers = readStickers(rootDir) as typeof nuxt.options.runtimeConfig.public.stickers;

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
      ], "git rev-parse --abbrev-ref HEAD") || "main",
      __NB_CURRENT_GIT_SHA__: gitInfo([
        process.env.VERCEL_GIT_COMMIT_SHA,
        process.env.CF_PAGES_COMMIT_SHA,
        // netlify
        process.env.COMMIT_REF
      ], "git rev-parse HEAD"),
      __NB_BUILDTIME_VITESTING__: isTest,
      __NB_CURRENT_VERSION__: readCurrentVersion(rootDir),
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
      // 以前没有 await：上传失败时是未处理的 rejection，构建结束时上传可能还没完成。
      // 现在等待上传完成；失败只记录错误，不中断部署，搜索索引会保持上一次的内容
      try {
        await uploadAlgoliaIndex();
      } catch (error) {
        logger.error("Algolia index upload failed. The site still deploys; the search index is not updated.", error);
      }
      fs.rmSync(path.join(publicDir, "e2e"), { recursive: true, force: true });
    });
  }
});
