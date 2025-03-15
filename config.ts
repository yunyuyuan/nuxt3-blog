export default {
  /** -------------------------------------------------以下必须修改----------------------------------------------------- */

  githubName: "yunyuyuan", // 必须修改，github账户名

  /** -------------------------------------------------以下可选修改----------------------------------------------------- */

  title: "yun yu yuan", // 网站标题
  nickName: "云与原", // 昵称
  domain: "https://blog.yunyuyuan.net", // rss域名
  SEO_title: " - yunyuyuan blog", // 搜索引擎显示的标题
  SEO_keywords: "yunyuyuan,yunyuyuan's blog,云与原,云与原的博客", // keywords meta header
  MSClarityId: "", // Microsoft的Clarity统计，https://clarity.microsoft.com/
  CloudflareAnalyze: "", // cloudflare的统计，https://developers.cloudflare.com/analytics/web-analytics
  CommentRepoId: "", // https://giscus.app/zh-CN
  CommentDiscussionCategoryId: "", // https://giscus.app/zh-CN

  MongoDb: {
    database: "nuxt3-blog",
    collection: "visitors",
    initialVisitors: 1, // 如果设置成10000，那么发一篇文章立马就有10000个浏览量！
    visitFromOwner: false // 网站拥有者访问时，是否增加浏览量
  },
  themeColor: "cyan", // 主题色，参考 https://tailwindcss.com/docs/colors
  themeColorDark: "neutral", // 主题色(夜间模式)
  defaultLang: "zh", // default language, "zh" and "en" are supported currently
  about: [
    "幽深宇宙已岁逾百亿，惟闪烁星光点缀生机",
    "我常仰望浩瀚天际，思念在同一颗星球的你",
    "想，那转瞬的迷人流星，也许就是你的回眸",
    "光坠之地，吾之忧祈",
    "——2021.12.4"
  ],

  /** -------------------------------------------------注意----------------------------------------------------- */

  githubRepo: "nuxt3-blog" // 需要与仓库名一致，如果fork时更改了仓库名，则这里也要改
};
