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
  CommentRepoId: "", // 评论系统，参考 https://github.com/yunyuyuan/nuxt3-blog/wiki/2.3-%E8%AF%84%E8%AE%BA%E7%B3%BB%E7%BB%9F
  CommentDiscussionCategoryId: "", // 评论系统

  database: { // 参考 https://github.com/yunyuyuan/nuxt3-blog/wiki/2.4-%E6%B5%8F%E8%A7%88%E9%87%8F%E7%BB%9F%E8%AE%A1
    initialVisitors: 1, // 如果设置成10000，那么发一篇文章立马就有10000个浏览量！
    visitFromOwner: false // 网站拥有者访问时，是否增加浏览量
  },
  algoliaSearch: { // 参考 https://github.com/yunyuyuan/nuxt3-blog/wiki/2.5-%E5%85%A8%E7%AB%99%E6%90%9C%E7%B4%A2
    appId: "",
    searchKey: "",
    indexName: ""
  },
  themeColor: ["cyan", "sky", "teal", "emerald", "purple", "indigo", "fuchsia", "orange", "amber"], // 主题色，如果有多个颜色，则随机使用，参考 https://tailwindcss.com/docs/colors
  themeColorDark: "neutral", // 主题色(夜间模式)
  defaultLang: "zh", // default language, "zh" and "en" are supported currently
  about: [
    "幽深宇宙已岁逾百亿，惟闪烁星光点缀生机",
    "我常仰望浩瀚天际，思念在同一颗星球的你",
    "想，那转瞬的迷人流星，也许就是你的回眸",
    "光坠之地，吾之忧祈",
    "——2021.12.4"
  ]
};
