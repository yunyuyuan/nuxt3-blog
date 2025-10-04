import fs from "fs";
import path from "path";
import { algoliasearch, type Action } from "algoliasearch";
import config from "../config";
import type { AlgoliaBody, ArticleItem, KnowledgeItem, RecordItem } from "../app/utils/common/types";
import { parseMarkdown } from "../app/utils/common/markdown";
import { genRss, getAbsolutePath, getRebuildPath, nbLog, walkAllBlogData } from "./utils";
import extractTextFromHtml from "./utils/html";

export function generateThemeColorsCSS() {
  const themeColors = config.themeColor;

  let cssContent = `:root {
  --color-primary-50: theme('colors.${config.themeColor[0]}.50');
  --color-primary-100: theme('colors.${config.themeColor[0]}.100');
  --color-primary-200: theme('colors.${config.themeColor[0]}.200');
  --color-primary-300: theme('colors.${config.themeColor[0]}.300');
  --color-primary-400: theme('colors.${config.themeColor[0]}.400');
  --color-primary-500: theme('colors.${config.themeColor[0]}.500');
  --color-primary-600: theme('colors.${config.themeColor[0]}.600');
  --color-primary-700: theme('colors.${config.themeColor[0]}.700');
  --color-primary-800: theme('colors.${config.themeColor[0]}.800');
  --color-primary-900: theme('colors.${config.themeColor[0]}.900');
  --color-primary-950: theme('colors.${config.themeColor[0]}.950');
}
`;

  themeColors.forEach((color) => {
    cssContent += `
.theme-${color} {
  --color-primary-50: theme('colors.${color}.50');
  --color-primary-100: theme('colors.${color}.100');
  --color-primary-200: theme('colors.${color}.200');
  --color-primary-300: theme('colors.${color}.300');
  --color-primary-400: theme('colors.${color}.400');
  --color-primary-500: theme('colors.${color}.500');
  --color-primary-600: theme('colors.${color}.600');
  --color-primary-700: theme('colors.${color}.700');
  --color-primary-800: theme('colors.${color}.800');
  --color-primary-900: theme('colors.${color}.900');
  --color-primary-950: theme('colors.${color}.950');
}
`;
  });

  const cssFilePath = getAbsolutePath("app/assets/style/generated-theme-colors.css");
  fs.writeFileSync(cssFilePath, cssContent);

  nbLog(`random themes generated: ${cssFilePath}`);
}

export function generateSiteMap(publicDir: string) {
  nbLog("sitemap");
  fs.writeFileSync(path.resolve(publicDir, "sitemap.xml"),
    genRss(JSON.parse(fs.readFileSync(getRebuildPath("json", "articles.json")).toString())));
}

export async function uploadAlgoliaIndex() {
  const appId = process.env.ALGOLIA_APP_ID || config.algoliaSearch.appId;
  const apiKey = process.env.ALGOLIA_ADMIN_KEY;
  const indexName = process.env.ALGOLIA_INDEX_NAME || config.algoliaSearch.indexName;
  if (!apiKey || !appId || !indexName) return;

  nbLog("start upload Algolia index");
  const blogData = walkAllBlogData();

  const client = algoliasearch(appId, apiKey);

  const dataMap: Record<string, AlgoliaBody> = {};

  for (const { type, list } of blogData) {
    for (const item of list.filter(item => !item.encrypt)) {
      const html = (await parseMarkdown(item._md)).md;

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
    if (page >= nbPages) {
      break;
    }
    page++;
  }

  const adds = allObjectIDs.filter(objectID => !exists.includes(objectID));
  const updates = allObjectIDs.filter(objectID => exists.includes(objectID));
  const deletes = exists.filter(objectID => !allObjectIDs.includes(objectID));

  // 合并所有操作请求
  const allRequests = [
    ...adds.map(objectID => ({
      action: "addObject" as Action,
      body: dataMap[objectID]
    })),
    ...updates.map(objectID => ({
      action: "updateObject" as Action,
      body: dataMap[objectID]
    })),
    ...deletes.map(objectID => ({
      action: "deleteObject" as Action,
      body: { objectID }
    }))
  ];

  // 每100条数据调用一个batch
  const batchSize = 100;
  const batches = [];
  for (let i = 0; i < allRequests.length; i += batchSize) {
    batches.push(allRequests.slice(i, i + batchSize));
  }

  // 执行所有批次
  for (let i = 0; i < batches.length; i++) {
    await client.batch({
      indexName,
      batchWriteParams: {
        requests: batches[i]
      }
    });
    nbLog(`Algolia batch ${i + 1}/${batches.length} uploaded (${batches[i].length} items)`);
  }

  nbLog(`Algolia index upload completed: ${adds.length} adds, ${updates.length} updates, ${deletes.length} deletes`);
}
