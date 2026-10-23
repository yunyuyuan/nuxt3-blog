import { parseMarkdown } from "#layers/nuxt-blog/app/utils/common/markdown";
import { hideEncryptBlocks } from "#layers/nuxt-blog/app/utils/common/process-encrypt-decrypt";
import type { CommonItem, HeaderTabUrl } from "#layers/nuxt-blog/app/utils/common/types";
import { markdownExcerpt } from "#layers/nuxt-blog/app/utils/common/utils";
import { fetchList, fetchMd } from "#layers/nuxt-blog/app/utils/nuxt/fetch";
import { isPrerender } from "#layers/nuxt-blog/app/utils/nuxt/constants";

export type MarkdownMenu = Awaited<ReturnType<typeof parseMarkdown>>["menu"];

/** 详情页放进 payload 的数据。预渲染时生成，水合和客户端导航直接复用 */
export type ContentPageData<T extends CommonItem> = {
  item: T;
  /** md 原文。只有要在浏览器里解密的条目（整篇加密或含加密块）才有，其余为 null */
  md: string | null;
  /** 构建期渲染的 HTML（预渲染时已经过 shiki 高亮和 KaTeX 渲染） */
  html: string;
  menu: MarkdownMenu;
  /** meta description；整篇加密的条目为空 */
  excerpt: string;
  /** 标签相同的条目，按相同标签数降序，最多 5 条 */
  related: { item: T; count: number }[];
};

/** 未登录、没有密码时页面显示的 md：整篇加密显示密文，加密块直接隐藏 */
export function visibleMarkdown(item: CommonItem, md: string) {
  if (item.encrypt) {
    return md;
  }
  return item.encryptBlocks?.length ? hideEncryptBlocks(md) : md;
}

function relatedItems<T extends CommonItem>(list: T[], item: T) {
  const tagsOf = (i: CommonItem) => ("tags" in i && Array.isArray(i.tags) ? i.tags as string[] : []);
  const tags = tagsOf(item);
  if (!tags.length) {
    return [];
  }
  return list
    .filter(i => i.id !== item.id)
    .map(i => ({ item: i, count: tagsOf(i).filter(t => tags.includes(t)).length }))
    .filter(i => i.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);
}

/** 读取条目和 md，并渲染 HTML。不调用 composable，可以放在 useAsyncData 的 handler 里 */
export async function loadContentPage<T extends CommonItem>(tab: HeaderTabUrl, id: string): Promise<ContentPageData<T> | null> {
  const list = await fetchList<T>(tab);
  const item = list.find(i => i.customSlug === id || i.id === Number(id));
  if (!item) {
    return null;
  }
  const md = await fetchMd(tab, String(item.id));
  const shown = visibleMarkdown(item, md);
  const { md: html, menu } = await parseMarkdown(shown, __NB_BASE_URL__, { prerender: isPrerender });
  const summary = "summary" in item && typeof item.summary === "string" ? item.summary : "";
  return {
    item,
    md: item.encrypt || item.encryptBlocks ? md : null,
    html,
    menu,
    excerpt: item.encrypt ? "" : summary || markdownExcerpt(shown),
    related: relatedItems(list, item)
  };
}
