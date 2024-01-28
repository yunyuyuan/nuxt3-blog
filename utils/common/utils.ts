import type { HeaderTabUrl, CommonItem, NeedsItem } from "./types";

/**
 * 生成唯一id
 */
let uniqueId = 0;
export function getUniqueId (): typeof uniqueId {
  return uniqueId++;
}

/**
 * 创建一个新item
 */
export function createNewItem (url: HeaderTabUrl): CommonItem {
  const baseInfo: NeedsItem = {
    id: 0,
    time: 0,
    modifyTime: 0,
    _show: true,
    visitors: 0,
    encrypt: false
  };
  switch (url) {
    case "/articles":
      return {
        title: "",
        len: 0,
        tags: [],
        ...baseInfo
      };
    case "/records":
      return {
        images: [],
        ...baseInfo
      };
    case "/knowledges":
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

export function escapeHtml (s: string) {
  return s.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function escapeNewLine (s: string) {
  return s.replace(/\r\n/g, "\n");
}

export function toggleCodeBlockTheme (theme?: string) {
  const body = document.body;
  theme = theme || (body.getAttribute("code-theme") === "light" ? "dark" : "light");
  body.setAttribute("code-theme", theme);
  localStorage.setItem("code-theme", theme);
}
