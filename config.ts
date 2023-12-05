export default {
  /** -------------------------------------------------以下必须修改----------------------------------------------------- */

  githubName: "yunyuyuan",                                     // 必须修改，github账户名



  /** -------------------------------------------------以下可选修改----------------------------------------------------- */

  title: "yun yu yuan",                                        // 网站标题
  nickName: "云与原",                                          // 昵称
  domain: "https://blog.yunyuyuan.net",                        // rss域名
  SEO_title: " - yunyuyuan blog",                              // 搜索引擎显示的标题
  SEO_keywords: "yunyuyuan,yunyuyuan's blog,云与原,云与原的博客", // keywords meta header
  MSClarityId: "",                                             // Microsoft的Clarity统计，https://clarity.microsoft.com/
  CloudflareAnalyze: "",                                       // cloudflare的统计，https://developers.cloudflare.com/analytics/web-analytics
  CommentRepoId: "",                                           // https://giscus.app/zh-CN
  CommentDiscussionCategoryId: "",                             // https://giscus.app/zh-CN

  Comment: {                                                   // 是否开启评论，请先设置上面的 CommentRepoId 和 CommentDiscussionCategoryId
    articles: true,                                            // “文章”是否开启评论
    records: false,                                            // “记录”是否开启评论
    knowledges: false                                          // “文化”是否开启评论
  },
  MongoDb: {                                                   // 浏览量统计，请先设置 https://vercel.com/integrations/mongodbatlas
    database: "nuxt3-blog",
    collection: "visitors",
    initialVisitors: 1,                                        // 如果设置成10000，那么发一篇文章立马就有10000个浏览量！
    visitFromOwner: false                                      // 网站拥有者访问时，是否增加浏览量
  },
  themeColor: "#2aa0bb",                                     // 主题色
  defaultLang: "zh",                                           // default language, "zh" and "en" are supported currently
  timezone: "Asia/Shanghai",                                   // timezone, please refer to https://en.wikipedia.org/wiki/List_of_tz_database_time_zones#List



  /** -------------------------------------------------注意----------------------------------------------------- */

  githubRepo: "nuxt3-blog"                                    // 需要与仓库名一致，如果fork时更改了仓库名，则这里也要改
};
