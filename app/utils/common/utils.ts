import type { CommonItem, HeaderTabUrl } from "./types";

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
export function createNewItem(url: HeaderTabUrl): CommonItem {
  const baseInfo = {
    id: 0,
    customSlug: "",
    time: 0,
    modifyTime: 0,
    showComments: false,
    encrypt: false,
    _show: true,
    _visitors: 0
  };

  if (url === "/articles") {
    return {
      title: "",
      len: 0,
      tags: [],
      ...baseInfo
    };
  } else if (url === "/records") {
    return {
      images: [],
      ...baseInfo
    };
  } else {
    return {
      title: "",
      summary: "",
      link: "",
      cover: "",
      type: "book",
      ...baseInfo
    };
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
