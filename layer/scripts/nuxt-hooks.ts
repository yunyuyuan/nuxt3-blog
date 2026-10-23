import fs from "fs";
import path from "path";
import { algoliasearch, type Action, type BatchRequest } from "algoliasearch";
import type { AlgoliaBody, ArticleItem, KnowledgeItem, RecordItem } from "../app/utils/common/types";
import { parseMarkdown } from "../app/utils/common/markdown";
import { genRss, genSitemap, getBlogContext, getRebuildPath, isDomainConfigured, nbLog, siteUrl, walkAllBlogData } from "./utils";
import extractTextFromHtml from "./utils/html";

/** 主题色的 CSS 变量：:root 用第一个颜色，.theme-<color> 用于随机切换。theme() 由 tailwind 解析 */
export function themeColorsCSS(themeColors: string[]) {
  const vars = (color: string) => [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950]
    .map(shade => `  --color-primary-${shade}: theme('colors.${color}.${shade}');`)
    .join("\n");

  let cssContent = `:root {\n${vars(themeColors[0]!)}\n}\n`;
  themeColors.forEach((color) => {
    cssContent += `\n.theme-${color} {\n${vars(color)}\n}\n`;
  });
  return cssContent;
}

/**
 * 生成 rss.xml（订阅）和 sitemap.xml（搜索引擎），并在 robots.txt 中声明 sitemap
 */
export function generateFeeds(publicDir: string) {
  const readList = (name: string) => JSON.parse(fs.readFileSync(getRebuildPath("json", `${name}.json`)).toString());
  const articles = readList("articles");
  fs.writeFileSync(path.resolve(publicDir, "rss.xml"), genRss(articles));
  nbLog("rss.xml generated");

  if (!isDomainConfigured()) {
    nbLog("config.domain is not set, skip sitemap.xml");
    return;
  }
  fs.writeFileSync(path.resolve(publicDir, "sitemap.xml"), genSitemap({
    "/articles": articles,
    "/records": readList("records"),
    "/knowledges": readList("knowledges")
  }));
  const robotsPath = path.resolve(publicDir, "robots.txt");
  if (fs.existsSync(robotsPath)) {
    const robots = fs.readFileSync(robotsPath).toString();
    if (!/^Sitemap:/im.test(robots)) {
      fs.writeFileSync(robotsPath, `${robots.trimEnd()}\n\nSitemap: ${siteUrl("sitemap.xml")}\n`);
    }
  }
  nbLog("sitemap.xml generated");
}

export async function uploadAlgoliaIndex() {
  const { config } = getBlogContext();
  const appId = config.algoliaSearch.appId;
  const apiKey = process.env.ALGOLIA_ADMIN_KEY;
  const indexName = config.algoliaSearch.indexName;
  if (!apiKey || !appId || !indexName) return;

  nbLog("start upload Algolia index");
  const blogData = walkAllBlogData();

  const client = algoliasearch(appId, apiKey);

  const dataMap: Record<string, AlgoliaBody> = {};

  for (const { type, list } of blogData) {
    for (const item of list.filter(item => !item.encrypt)) {
      const { md } = await parseMarkdown(item._md, process.env.NUXT_APP_BASE_URL || "/");
      const html = await md;

      const extractedText = extractTextFromHtml(html);
      // return fs.writeFileSync(`.output${type}-${item.id}.txt`, extractedText);

      const objectID = `${type}/${item.id}`;
      const body: AlgoliaBody & { objectID: string } = {
        title: "",
        metaData: {},
        cover: "",
        content: extractedText,
        objectID
      };
      if (type === "/articles") {
        body.title = (item as ArticleItem).title;
        body.metaData = (item as ArticleItem).tags;
      } else if (type === "/records") {
        body.title = (item as RecordItem).images.map(img => img.alt).join(" | ");
        body.cover = (item as RecordItem).images[0]?.src ?? "";
        body.metaData = (item as RecordItem).images.length;
      } else {
        body.title = (item as KnowledgeItem).title;
        body.cover = (item as KnowledgeItem).cover;
        body.metaData = (item as KnowledgeItem).type;
      }

      dataMap[objectID] = body;
    }
  }

  const allObjectIDs = Object.keys(dataMap);
  const exists: string[] = [];
  let page = 0;
  while (true) {
    const { hits, nbPages } = await client.browse({ indexName, browseParams: {
      page,
      attributesToRetrieve: ["objectID"]
    } });
    exists.push(...hits.map(hit => hit.objectID));
    // page 从 0 开始，nbPages 是总页数
    if (page + 1 >= (nbPages ?? 0)) {
      break;
    }
    page++;
  }

  const adds = allObjectIDs.filter(objectID => !exists.includes(objectID));
  const updates = allObjectIDs.filter(objectID => exists.includes(objectID));
  const deletes = exists.filter(objectID => !allObjectIDs.includes(objectID));

  // 合并所有操作请求
  const allRequests: BatchRequest[] = [
    ...adds.map(objectID => ({
      action: "addObject" as Action,
      body: dataMap[objectID]!
    })),
    ...updates.map(objectID => ({
      action: "updateObject" as Action,
      body: dataMap[objectID]!
    })),
    ...deletes.map(objectID => ({
      action: "deleteObject" as Action,
      body: { objectID }
    }))
  ];

  // 每100条数据调用一个batch
  const batchSize = 100;
  const batches: BatchRequest[][] = [];
  for (let i = 0; i < allRequests.length; i += batchSize) {
    batches.push(allRequests.slice(i, i + batchSize));
  }

  // 执行所有批次
  for (const [i, batch] of batches.entries()) {
    await client.batch({
      indexName,
      batchWriteParams: {
        requests: batch
      }
    });
    nbLog(`Algolia batch ${i + 1}/${batches.length} uploaded (${batch.length} items)`);
  }

  nbLog(`Algolia index upload completed: ${adds.length} adds, ${updates.length} updates, ${deletes.length} deletes`);
}
