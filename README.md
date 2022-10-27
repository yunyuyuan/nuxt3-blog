# Pure Front-End Blog
---

![](https://img.shields.io/github/license/yunyuyuan/nuxt3-blog) ![](https://img.shields.io/badge/vue-v3-%234FC08D?logo=vue.js) ![](https://img.shields.io/badge/nuxt-v3-%2300DC82?logo=nuxt.js)

> 🚀 [https://blog.halberd.cn](https://blog.halberd.cn)

### Quick Start
1. Fork本仓库，勿修改仓库名
2. 大体参考[旧版教程](https://blog.halberd.cn/articles/6562)
3. 需要更改vercel的编译参数，如下图：![](https://s1.ax1x.com/2022/06/03/XNXXvR.png)
4. 若使用评论功能，则需要安装[giscus](https://github.com/apps/giscus)，并开启[discussion](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/enabling-or-disabling-github-discussions-for-a-repository)，然后填写`config.ts`中的`CommentRepoId`和`CommentDiscussionCategoryId`  
  参考[giscus.app](https://giscus.app/zh-CN#:~:text=%E4%BB%93%E5%BA%93%EF%BC%9A,%E8%BF%9E%E6%8E%A5%E5%88%B0%E6%AD%A4%E4%BB%93%E5%BA%93%E3%80%82)，填写仓库地址后，复制下面的`data-repo-id`和`data-category-id`，分别对应`CommentRepoId`和`CommentDiscussionCategoryId`，位置在[data-repo-id和data-category-id](https://giscus.app/zh-CN#:~:text=%E5%9C%A8%E4%BD%A0%E6%83%B3%E8%AE%A9%E8%AF%84%E8%AE%BA%E5%87%BA%E7%8E%B0%E7%9A%84%E4%BD%8D%E7%BD%AE%E6%B7%BB%E5%8A%A0%E4%BB%A5%E4%B8%8B%20%3Cscript%3E%20%E6%A0%87%E7%AD%BE%E3%80%82%E4%BD%86%E5%A6%82%E6%9E%9C%E5%B7%B2%E7%BB%8F%E5%AD%98%E5%9C%A8%E5%B8%A6%E6%9C%89%20giscus%20%E7%B1%BB%E7%9A%84%E5%85%83%E7%B4%A0%EF%BC%8C%E5%88%99%E8%AF%84%E8%AE%BA%E4%BC%9A%E8%A2%AB%E6%94%BE%E5%9C%A8%E9%82%A3%E9%87%8C%E3%80%82)

### Todo list
Feature
- [x] eslint,stylelint
- [x] error page
- [ ] different passwd(unnecessary)
- [x] localhost server for committing
- [ ] testing
- [ ] custom markdown syntax highlight on monaco editor 
- [x] full-static site generate(SSG)
- [ ] toggle plugin enabled,and implement conditional build
- [ ] get new feature by pull source branch with single action 
- [x] serverless function to upload image
- [ ] IV for AES encrypt
- [x] partial encrypt
- [ ] pagination

Appearance
- [x] global theme color
- [ ] i18n
- [ ] left-side layout
- [x] dark mode
