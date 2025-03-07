<p align="center">
<img width="200px" src="public/favicon.png" />
</p>
<h1 align="center">💎Nuxt3-Blog</h1>


[![](https://img.shields.io/github/license/yunyuyuan/nuxt3-blog)](/LICENSE) ![](https://img.shields.io/badge/vue-v3-%234FC08D?logo=vue.js) ![](https://img.shields.io/badge/nuxt-v3-%2300DC82?logo=nuxt.js)

**🚀Deployed on multiple platforms via [NitroJS](https://nitro.unjs.io/) (the [official engine](https://nuxt.com/docs/guide/concepts/server-engine) for Nuxt3)**
> Vercel: [https://blog.yunyuyuan.net](https://blog.yunyuyuan.net)
> 
> Cloudflare Page: [https://blog-cfpage.yunyuyuan.net](https://blog-cfpage.yunyuyuan.net)
> 
> Netlify: [https://blog-netlify.yunyuyuan.net](https://blog-netlify.yunyuyuan.net)
>
**🚀Self-hosted deployment (refer to [my article](https://blog.yunyuyuan.net/articles/8346))**
> Drone: [https://blog-drone-cf.yunyuyuan.net](https://blog-drone-cf.yunyuyuan.net), where `cf` means using Cloudflare for intranet penetration

English Readme | [中文说明](/README.zh.md)

# Blog Features
* 💻 **5-minute setup**. Quick deployment without writing a single line of code.
* 🤝 **Easy to use**. Powerful admin interface that requires just one token to **update configurations, add/modify/delete blog content via web interface**, no need for `notepad` or `git push`.
* 📷 **Integrated image hosting**. Integrated with smms image hosting and tinypng image compression, one-click upload for blog images.
* 🌐 **Pure static**. Packaged as a pure static website, no backend required.
* 🔍 **SEO friendly**. Every HTML page is pre-rendered, making it indexable by search engines.
* 🔒 **Encryption support**. Ability to encrypt any individual **article/record/culture** entry, or encrypt specific content sections that can only be viewed with a password.
  * 🚪Full page encryption:  
      <img height="300px" src="https://s2.loli.net/2023/03/09/6loknpQFATqSOMB.png"/>
  * 🚪Partial encryption:  
      <img height="300px" src="https://s2.loli.net/2023/03/09/9UQurkTGaOSY3j4.png"/>

# Setup Guide
<center>
<img width="600px" src="https://s2.loli.net/2024/03/10/ih2KsmBDISAWN3U.png"/>
</center>

1. Fork this project.
2. Change `githubName` in `config.ts` to your current Github account. If your repository name is not **nuxt3-blog**, also modify `githubRepo`.
3. Deploy on any [Nitro-supported platform](https://nitro.unjs.io/deploy).
4. Go to [https://github.com/settings/tokens/new](https://github.com/settings/tokens/new), select the **repo** scope, and click `Generate`.
5. Visit https://your-blog-domain/manage and enter your GitHub token.
6. Enjoy creating content.

#### Additional Steps
* To use the page view statistics feature, you need to [register for a MongoDB account](https://www.mongodb.com/cloud/atlas/register), create a database named `nuxt3-blog`, and set up MongoDB environment variables (refer to `env.sample`)
* To use the comment feature, install [giscus](https://github.com/apps/giscus) for GitHub, enable [discussions](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/enabling-features-for-your-repository/enabling-or-disabling-github-discussions-for-a-repository), and fill in `CommentRepoId` and `CommentDiscussionCategoryId` in `config.ts`  
  Refer to giscus.app, [enter](https://giscus.app/en) **your repository** address, then copy `data-repo-id` and `data-category-id`, which correspond to `CommentRepoId` and `CommentDiscussionCategoryId` respectively

# To-Do List
#### Features
- [ ] 404 page
- [x] Update data in local `npm run dev` environment
- [x] Automated testing
- [x] Static Site Generation (SSG)
- [ ] Plugin system
- [x] Support for serverless function image uploads
- [x] Database integration (page view statistics)
- [ ] Algolia site-wide search
- [x] Blog image backup and migration
- [x] Password modification (currently only supports modification via npm scripts locally)

#### Appearance
- [x] Dark mode
- [x] Internationalization
- [ ] Multiple layout themes (lacking UI design)
- [x] Custom theme colors
##### Low Priority Features
- [ ] Different passwords for different encrypted pages
- [ ] Monaco editor support for additional markdown syntax highlighting
- [ ] One-click pull updates from upstream GitHub repository
- [ ] IV for AES encryption
- [x] Block-level encryption
- [x] SSR for self-hosting ([reference](https://blog.yunyuyuan.net/articles/8346))
- [ ] Support for Cloudflare Pages, Netlify, and other services

# Project Structure
* `/assets`
  * `/image` Images imported by Vite
  * `/style` Public/functional styles
* `/components` Vue components, automatically loaded by Nuxt
* `/composables` Vue reactivity, automatically loaded by Nuxt
* `/e2e` E2E testing
* `/i18n` Internationalization translation files
* `/layouts` Nuxt layout files
* `/middleware` Nuxt route guards
* `/pages` All web views
* `/plugins` Nuxt plugins
* `/public`
  * `/e2e/rebuild` Mock data for E2E testing
  * `/rebuild` All blog data
  * `/sticker` All emoji images
* `/scripts` Scripts executed by Gulp
* `/server` API server (Node.js)
* `/utils`
  * `/api` Functions called by `/server`
  * `/common` JavaScript-related functional code (not dependent on Vue or Nuxt)
  * `/hooks` Some composable encapsulation logic
  * `/nuxt` Nuxt-related functional code
* `/vite-plugins` Vite plugins
* `/config.ts` Blog configuration, must be modified

# Node Scripts
```json5
"scripts": {
  "build": "nuxt build", // Compile for SSR
  "dev": "nuxt dev", // Development
  "dev-for-test": "cross-env NUXT_PORT=13000 VITESTING=\"true\" nuxt dev", // For E2E testing
  "generate": "nuxt generate", // Deprecated
  "local:change-pwd": "gulp change-passwd", // Global password modification
  "local:generate-img-map": "gulp generate-image-map", // Collect all site images, output to img.json
  "local:download-img": "gulp download-image", // Read img.json, download all images to imgs/
  "local:substitute-img": "gulp substitute-image", // Read img.json, replace with new images (before running this script, modify newUrl in img.json to the URL to be replaced)
  "test:unit": "vitest run --exclude ./e2e", // Unit testing
  "test:e2e": "vitest run --dir ./e2e", // E2E testing
  "test:dev-and-e2e": "start-server-and-test dev-for-test http://localhost:13000 test:e2e", // Run test service and start E2E testing
  "eslint": "eslint --fix .", // Run eslint
  "preview": "nuxt preview", // Preview compiled website
  "prepare": "husky" // Install husky
}
```

# Changelog

[CHANGELOG.md](/CHANGELOG.md)

# Other
* Technical support/discussion QQ group: 745105612
* Email: me@yunyuyuan.net
* Discord: https://discord.gg/HtSehSMYXa