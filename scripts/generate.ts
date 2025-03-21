import fs from "fs";
import path from "path";
import { algoliasearch } from "algoliasearch";
import config from "../config";
import type { AlgoliaBody, ArticleItem, KnowledgeItem, RecordItem } from "../utils/common/types";
import { genRss, getRebuildPath, nbLog, walkAllBlogData } from "./utils";

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
    list.filter(item => !item.encrypt).forEach((item) => {
      const body: AlgoliaBody = {
        title: "",
        metaData: "",
        content: item._md
      };
      if (type === "/articles") {
        body.title = (item as ArticleItem).title;
        body.metaData = (item as ArticleItem).tags.join(" | ");
      } else if (type === "/records") {
        body.title = (item as RecordItem).images.map(img => img.alt).join(" | ");
      } else {
        body.title = (item as KnowledgeItem).title;
        body.metaData = (item as KnowledgeItem).summary;
      }

      const objectID = `${type.replace("/", "")}-${item.id}`;
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
