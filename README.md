<p align="center">
<img width="200px" src="public/favicon.png" />
</p>
<h1 align="center">💎Nuxt3-Blog</h1>

---

[![](https://img.shields.io/github/license/yunyuyuan/nuxt3-blog)](/LICENSE) ![](https://img.shields.io/badge/vue-v3-%234FC08D?logo=vue.js) ![](https://img.shields.io/badge/nuxt-v3-%2300DC82?logo=nuxt.js)

> 🚀[https://blog.yunyuyuan.net](https://blog.yunyuyuan.net)

English Readme | [中文说明](/README.zh.md)

# Features
* 💻 **Build in 5 minutes**. Completely free, no need to write any code.
* 🤝 **Convenient to use**. An all-in-one admin interface where you only need a token to **update configurations, add/edit/delete blog content on the web page**. no `notepad`, no `git push`.
* 📷 **Integrated image hosting service**. Integrated with `smms` image hosting service and `tinypng` image compression, one-click upload of blog images on the web page.
* 🌐 **Full static**. Packaged as a full static website, no backend required.
* 🔍 **SEO-friendly**. Each HTML page is pre-rendered and can be indexed by search engines.
* 🔒 **Can be encrypted**. Any single **article/record/knowledge** can be encrypted, and content can be encrypted in block-level. Only by entering the password can it be viewed.
  * 🚪Full encryption:  
      <img height="300px" src="https://s2.loli.net/2023/03/09/6loknpQFATqSOMB.png"/>
  * 🚪Block-level encryption:  
      <img height="300px" src="https://s2.loli.net/2023/03/09/9UQurkTGaOSY3j4.png"/>

# How to use
<center>
<img width="600px" src="https://s2.loli.net/2023/05/12/742XNyquQ3CTRWO.png"/>
</center>

## Two ways to deploy
### The first way: One-click deployment (note：uncheck `Create private Git Repository`)
[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyunyuyuan%2Fnuxt3-blog&repository-name=nuxt3-blog)

### The second way: fork and deploy(recommended if you want to sync my future commits)
1. fork this project
2. deploy within vercel(no need to change any build params)


## After deploy
#### Change user
Change `githubName` in `config.ts` to your current Github account.

#### Generate a new token
Goto https://github.com/settings/tokens/new, check **repo** scopes, then click `Generate token`.

#### Addons
* If you want to use the views analyze feature, you need to [register a MongoDB account](https://www.mongodb.com/cloud/atlas/register), and enable [MongoDB integration](https://vercel.com/integrations/mongodbatlas)
* If you want to use the commenting feature, you need to install [giscus](https://github.com/apps/giscus) for your Github, and enable [discussion](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/enabling-or-disabling-github-discussions-for-a-repository). Changing `CommentRepoId` and `CommentDiscussionCategoryId` in `config.ts`. Please goto [giscus.app](giscus.app) to get more information.

# Todo
#### Features
- [ ] 404 page
- [x] work with `npm run dev`
- [ ] testing
- [x] full-static site generate(SSG)
- [ ] plugin system
- [x] serverless function to upload images
- [x] mongodb integration(views analyze)
- [ ] algolia searching
- [x] images migration
- [x] changing password(only available while using `npm run dev`)


#### Appearance
- [x] dark mode
- [x] i18n
- [ ] themes(need UI)
- [x] custom primary color
##### Low priority features
- [ ] different password for every content
- [ ] custom-syntax highlight for monaco editor
- [ ] pulling update of upsteam github repo
- [ ] IV for AES encryption
- [x] block level encryption
- [ ] SSR for self-hosting
- [ ] support cloudflare page,netlify and others

# Project Structure
* `/api` serverless functions.
* `/assets`
  * `/image` images that imported by vite.
  * `/style` public style and utils style.
  * `/svg` all svg files, will used by `/components/svg-icon.vue`.
* `/components` vue components, auto-import by nuxt.
* `/composables` vue composables, auto-import by nuxt.
* `/vite-plugins` vite plugins.
* `/i18n` i18n message files.
* `/layouts` nuxt layout files.
* `/lib` functions used by `/api`.
* `/pages` all views page.
* `/plugins` nuxt plugin files.
* `/public`
  * `/rebuild` all blog data.
  * `/sticker` all stickers for markdown.
* `/scripts`
  * `/generate.ts` script for `npm run generate`.
  * `/change-pwd.ts` script for `npm run chpwd`, run it locally when you want to change your password.
* `/utils`
  * `/nuxt` common codes of nuxt.
  * `/common` common codes of javascript.
* `/config.ts` blog configurations, your must change it.


# Changelog

[CHANGELOG.md](/CHANGELOG.md)

# Others
* QQ group：745105612
* email：me@yunyuyuan.net
* discord: https://discord.gg/HtSehSMYXa
