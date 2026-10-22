import type { CommonItem, DecryptFunction, HeaderTabUrl, ArticleItem, RecordItem, KnowledgeItem, EncryptBlock } from "./types";

/**
 * 三种类型的数据加解密
 */
export async function encryptDecryptItem(
  item: CommonItem,
  fn: DecryptFunction,
  url: HeaderTabUrl
) {
  switch (url) {
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
export async function getEncryptedBlocks(md: string, encrypt: DecryptFunction): Promise<{
  md: string;
  blocks: EncryptBlock[];
}> {
  const reg = new RegExp(/(^|\n)\[encrypt]\n([\s\S]+?)\n\[\/encrypt]/, "gd");
  let matcher;
  const encryptBlocks: EncryptBlock[] = [];
  while (true) {
    matcher = reg.exec(md);
    if (matcher && matcher.indices) {
      const [start, end] = matcher.indices[2] || [0, 0];
      const encryptedText = await encrypt(matcher[2] || "");
      md = md.slice(0, start) + encryptedText + md.slice(end);
      encryptBlocks.push({
        start,
        end: end + encryptedText.length - (matcher[2]?.length || 0)
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

// encryptBlocks 的 start/end 指向 [encrypt]\n 与 \n[/encrypt] 之间的密文。
// 区块按 start 从大到小保存，所以依次替换不会改变后面区块的位置。

/** 未登录：连同 [encrypt] 标记一起去掉加密块 */
export function hideEncryptBlocks(md: string, blocks: EncryptBlock[]) {
  let result = md;
  for (const { start, end } of blocks) {
    result = result.slice(0, start - 10) + result.slice(end + 11);
  }
  return result;
}

/** 已登录但没有密码：加密块显示为占位文字 */
export function showEncryptBlocksPlaceholder(md: string, blocks: EncryptBlock[], placeholder: string) {
  let result = md;
  for (const { start, end } of blocks) {
    result = result.slice(0, start) + placeholder + "![sticker](aru/59)" + result.slice(end);
  }
  return result;
}

/** 有密码：解密每个加密块 */
export async function decryptEncryptBlocks(md: string, blocks: EncryptBlock[], decrypt: DecryptFunction) {
  let result = md;
  for (const { start, end } of blocks) {
    result = result.slice(0, start) + await decrypt(result.slice(start, end)) + result.slice(end);
  }
  return result;
}
