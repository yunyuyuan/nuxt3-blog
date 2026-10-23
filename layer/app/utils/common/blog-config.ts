/**
 * 站点配置的结构。站点配置是站点项目根目录下的 config.ts，
 * 前端代码通过 "~~/config" 导入它，构建期代码通过 loadBlogConfig() 读取它。
 */
export interface BlogConfig {
  /** GitHub 账户名 */
  githubName: string;
  /** 网站标题 */
  title: string;
  nickName: string;
  /** 站点域名，用于 rss.xml 和 sitemap.xml */
  domain: string;
  SEO_title: string;
  SEO_keywords: string;
  MSClarityId: string;
  CloudflareAnalyze: string;
  CommentRepoId: string;
  CommentDiscussionCategoryId: string;
  database: {
    initialVisitors: number;
    visitFromOwner: boolean;
  };
  algoliaSearch: {
    appId: string;
    searchKey: string;
    indexName: string;
  };
  /** tailwind 颜色名；有多个时随机使用 */
  themeColor: string[];
  /** 夜间模式的 tailwind 颜色名 */
  themeColorDark: string;
  defaultLang: string;
  about: string[];
  /** 仓库名 */
  githubRepo: string;
}
