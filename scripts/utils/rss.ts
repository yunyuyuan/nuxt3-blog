import { joinURL } from "ufo";
import type { ArticleItem, CommonItem, HeaderTabUrl } from "../../app/utils/common/types";
import { escapeHtml } from "../../app/utils/common/utils";
import config from "../../config";

type FeedData = Record<HeaderTabUrl, CommonItem[]>;

function el(tag: string, content: string | string[], attrs: Record<string, string> = {}) {
  const attrStr = Object.entries(attrs).map(([k, v]) => ` ${k}="${escapeHtml(v)}"`).join("");
  const body = Array.isArray(content) ? content.join("") : escapeHtml(content);
  return `<${tag}${attrStr}>${body}</${tag}>`;
}

function getOrigin() {
  return config.domain;
}

function getBaseURL() {
  return process.env.NUXT_APP_BASE_URL || "/";
}

/** 站点域名是否已配置（不是模板里的占位符） */
export function isDomainConfigured() {
  return /^https?:\/\/[^<>\s]+$/.test(getOrigin());
}

/** 条目的规范地址：有 customSlug 时用 slug，否则用 id（id 地址会重定向到 slug） */
export function itemUrl(tab: HeaderTabUrl, item: CommonItem) {
  return joinURL(getOrigin(), getBaseURL(), tab, item.customSlug || String(item.id));
}

export function siteUrl(...paths: string[]) {
  return joinURL(getOrigin(), getBaseURL(), ...paths);
}

/** RSS 2.0：只包含未加密的文章 */
export function genRss(articles: ArticleItem[]) {
  const items = articles.filter(i => !i.encrypt).map(i => el("item", [
    el("title", i.title),
    el("link", itemUrl("/articles", i)),
    // guid 保持为 id，已订阅的阅读器不会把旧文章当成新文章
    el("guid", String(i.id), { isPermaLink: "false" }),
    el("pubDate", new Date(i.time).toUTCString()),
    el("dc:creator", config.nickName || config.githubName),
    ...i.tags.map(tag => el("category", tag))
  ]));
  const channel = el("channel", [
    el("title", config.title),
    el("link", siteUrl()),
    el("description", config.title),
    el("language", config.defaultLang),
    el("lastBuildDate", new Date().toUTCString()),
    `<atom:link href="${escapeHtml(siteUrl("rss.xml"))}" rel="self" type="application/rss+xml"/>`,
    ...items
  ]);
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
    + `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">${channel}</rss>`;
}

/** sitemaps.org 格式的站点地图：所有栏目的列表页和未整篇加密的条目 */
export function genSitemap(data: FeedData) {
  const urls: string[] = [];
  const url = (loc: string, lastmod?: number) => el("url", [
    el("loc", loc),
    ...(lastmod ? [el("lastmod", new Date(lastmod).toISOString())] : [])
  ]);
  urls.push(url(siteUrl()));
  for (const [tab, list] of Object.entries(data) as [HeaderTabUrl, CommonItem[]][]) {
    const visible = list.filter(i => !i.encrypt);
    const latest = Math.max(0, ...visible.map(i => i.modifyTime || i.time));
    urls.push(url(siteUrl(tab), latest || undefined));
    for (const item of visible) {
      urls.push(url(itemUrl(tab, item), item.modifyTime || item.time));
    }
  }
  urls.push(url(siteUrl("about")));
  return "<?xml version=\"1.0\" encoding=\"UTF-8\"?>"
    + `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls.join("")}</urlset>`;
}
