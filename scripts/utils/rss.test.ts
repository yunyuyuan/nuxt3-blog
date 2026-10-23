import { describe, expect, it } from "vitest";
import type { ArticleItem, KnowledgeItem, RecordItem } from "../../app/utils/common/types";
import { escapeHtml } from "../../app/utils/common/utils";
import { genRss, genSitemap, itemUrl as rawItemUrl, siteUrl as rawSiteUrl } from "./rss";

// 输出中的 URL 经过 xml 转义（模板域名含 <>）
const siteUrl = (...p: string[]) => escapeHtml(rawSiteUrl(...p));
const itemUrl = (...a: Parameters<typeof rawItemUrl>) => escapeHtml(rawItemUrl(...a));

const base = { customSlug: "", time: 1700000000000, modifyTime: 1700000500000, showComments: false, encrypt: false };
const articles: ArticleItem[] = [
  { ...base, id: 1, title: "A & B", len: 10, tags: ["vue"], customSlug: "a-and-b" },
  { ...base, id: 2, title: "secret", len: 10, tags: [], encrypt: true }
];
const records: RecordItem[] = [{ ...base, id: 3, images: [] }];
const knowledges: KnowledgeItem[] = [{ ...base, id: 4, title: "k", type: "book", link: "", cover: "", summary: "" }];

describe("genRss", () => {
  const rss = genRss(articles);

  it("is an RSS 2.0 document with the required channel fields", () => {
    expect(rss).toMatch(/^<\?xml version="1.0" encoding="UTF-8"\?><rss version="2.0"/);
    expect(rss).toContain("<description>");
    expect(rss).toContain(`<atom:link href="${siteUrl("rss.xml")}" rel="self" type="application/rss+xml"/>`);
  });

  it("only includes unencrypted articles, linked by slug, with an RFC 822 date", () => {
    expect(rss).toContain("<title>A &amp; B</title>");
    expect(rss).not.toContain("<title>secret</title>");
    expect(rss).toContain(`<link>${itemUrl("/articles", articles[0]!)}</link>`);
    expect(rawItemUrl("/articles", articles[0]!)).toMatch(/\/articles\/a-and-b$/);
    expect(rss).toContain(`<pubDate>${new Date(base.time).toUTCString()}</pubDate>`);
    expect(rss).toContain("<guid isPermaLink=\"false\">1</guid>");
  });
});

describe("genSitemap", () => {
  const sitemap = genSitemap({ "/articles": articles, "/records": records, "/knowledges": knowledges });

  it("uses the sitemaps.org urlset format", () => {
    expect(sitemap).toContain("<urlset xmlns=\"http://www.sitemaps.org/schemas/sitemap/0.9\">");
  });

  it("lists every tab and every unencrypted item with lastmod", () => {
    for (const tab of ["articles", "records", "knowledges", "about"]) {
      expect(sitemap).toContain(`<loc>${siteUrl(tab)}</loc>`);
    }
    expect(sitemap).toContain(`<loc>${itemUrl("/records", records[0]!)}</loc>`);
    expect(sitemap).toContain(`<loc>${itemUrl("/knowledges", knowledges[0]!)}</loc>`);
    expect(sitemap).toContain(`<lastmod>${new Date(base.modifyTime).toISOString()}</lastmod>`);
    expect(sitemap).not.toContain(itemUrl("/articles", articles[1]!));
  });
});
