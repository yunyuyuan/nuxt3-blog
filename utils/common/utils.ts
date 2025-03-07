import type { ArticleItem, HeaderTabUrl, ItemBase, KnowledgeItem, RecordItem } from "./types";

/**
 * 生成唯一id
 */
let uniqueId = 0;
export function getUniqueId(): typeof uniqueId {
  return uniqueId++;
}

/**
 * 创建一个新item
 */
export function createNewItem(url: HeaderTabUrl) {
  const baseInfo: ItemBase = {
    id: 0,
    time: 0,
    modifyTime: 0,
    _show: true,
    _visitors: 0,
    showComments: false,
    encrypt: false
  };
  switch (url) {
    case "/articles":
      return {
        title: "",
        len: 0,
        tags: [],
        ...baseInfo
      } as ArticleItem;
    case "/records":
      return {
        images: [],
        ...baseInfo
      } as RecordItem;
    case "/knowledges":
      return {
        title: "",
        summary: "",
        link: "",
        cover: "",
        type: "book",
        ...baseInfo
      } as KnowledgeItem;
  }
}

export function escapeHtml(s: string, inUrl = false) {
  return s.toString()
    .replace(/&/g, inUrl ? "-" : "&amp;")
    .replace(/</g, inUrl ? "-" : "&lt;")
    .replace(/>/g, inUrl ? "-" : "&gt;")
    .replace(/"/g, inUrl ? "-" : "&quot;")
    .replace(/'/g, inUrl ? "-" : "&apos;");
}

// 用在两个地方：提交时，获取时
export function escapeNewLine(s: string) {
  return s.replace(/\r\n/g, "\n");
}
