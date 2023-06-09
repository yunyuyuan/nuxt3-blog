import { CommonItem, ArticleItem, RecordItem, KnowledgeItem, HeaderTabUrl, DecryptFunction, EncryptBlock } from "./types";

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

/**
 * 先加密block，然后获取这些block的start和end位置
 */
export async function getEncryptedBlocks (md: string, encrypt: DecryptFunction): Promise<{
  md: string,
  blocks: EncryptBlock[]
}> {
  const reg = /(^|\n)\[encrypt]\n([\s\S]+?)\n\[\/encrypt]/gd;
  let matcher;
  const encryptBlocks: EncryptBlock[] = [];
  while (true) {
    matcher = reg.exec(md);
    if (matcher && matcher.indices) {
      const [start, end] = matcher.indices[2];
      const encryptedText = await encrypt(matcher[2]);
      md = md.slice(0, start) + encryptedText + md.slice(end);
      encryptBlocks.push({
        start,
        end: end + encryptedText.length - matcher[2].length
      });
    } else {
      break;
    }
  }
  return {
    md,
    blocks: encryptBlocks
  };
}
