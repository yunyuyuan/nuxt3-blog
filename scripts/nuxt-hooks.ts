import fs from "fs";
import path from "path";
import { algoliasearch } from "algoliasearch";
import config from "../config";
import type { AlgoliaBody, ArticleItem, KnowledgeItem, RecordItem } from "../utils/common/types";
import { parseMarkdown } from "../utils/common/markdown";
import { genRss, getAbsolutePath, getRebuildPath, nbLog, walkAllBlogData } from "./utils";
import extractTextFromHtml from "./utils/html";

export function generateThemeColorsCSS() {
  const themeColors = config.themeColor;

  let cssContent = `/* AUTO GENERATED: ${new Date().toISOString()} */
/* set a default */
:root {
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

  const cssFilePath = getAbsolutePath("assets/style/generated-theme-colors.css");
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

  blogData.forEach(({ type, list }) => {
    list.filter(item => !item.encrypt).forEach(async (item) => {
      const html = (await parseMarkdown(item._md)).md;

      const extractedText = extractTextFromHtml(html);
      // return fs.writeFileSync(`.output${type}-${item.id}.txt`, extractedText);
      const body: AlgoliaBody = {
        title: "",
        metaData: {},
        cover: "",
        content: extractedText
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

      const objectID = `${type}/${item.id}`;
      client.addOrUpdateObject({
        indexName: indexName,
        objectID,
        body
      }).then(() => {
        nbLog(`uploaded Algolia index: ${objectID}`);
      });
    });
  });
}
