import { CommonItem, ArticleItem, RecordItem, KnowledgeItem, HeaderTabUrl } from "./types";

/**
 * 三种类型的数据加解密
 */
export async function processEncryptDecrypt (
  item: CommonItem,
  fn: (_s: string) => Promise<string>,
  type: HeaderTabUrl
) {
  switch (type) {
    case "/articles":
      item = item as ArticleItem;
      item.title = await fn(item.title);
      break;
    case "/records":
      item = item as RecordItem;
      for (const img of item.images) {
        img.src = await fn(img.src);
        img.alt = await fn(img.alt);
      }
      break;
    case "/knowledges":
      item = item as KnowledgeItem;
      item.cover = await fn(item.cover);
      item.title = await fn(item.title);
      item.summary = await fn(item.summary);
      item.link = await fn(item.link);
      break;
  }
}
