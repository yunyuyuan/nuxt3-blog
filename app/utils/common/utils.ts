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

/**
 * 从 markdown 中提取纯文本摘要，用于 meta description。
 * 去掉加密块、原始 html、代码、公式、媒体嵌入和图片，保留链接与自定义样式中的文字。
 */
export function markdownExcerpt(md: string, maxLength = 150) {
  const text = escapeNewLine(md)
    .replace(/\[encrypt\][\s\S]*?\[\/encrypt\]/g, " ")
    .replace(/\[html\][\s\S]*?\[\/html\]/g, " ")
    .replace(/\[(youtube|bili|video|audio)\][\s\S]*?\[\/\1\]/g, " ")
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/\$\$[\s\S]+?\$\$/g, " ")
    .replace(/\[![\s\S]+?!\]/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/#?\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/-\([#a-zA-Z0-9]+: (.+?)\)-/g, "$1")
    .replace(/_\((.+?)\)_/g, "$1")
    .replace(/<<>>/g, "")
    .replace(/<[^>]+>/g, " ")
    // 块级标记：::: 容器、-- legend -- 字段集、分隔线、表格分隔行
    .replace(/^:::\s*(info|tip|warning|danger|details)?/gm, "")
    .replace(/^[\s|:-]*-{3,}[\s|:-]*$/gm, "")
    .replace(/^--(.*?)--$/gm, "$1")
    .replace(/^\s{0,3}(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*~`|]/g, "")
    // 反斜杠转义，例如 https:\/\/
    .replace(/\\([\\`*_{}[\]()#+\-.!/|>~])/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
  return text.length > maxLength ? `${text.slice(0, maxLength)}…` : text;
}
