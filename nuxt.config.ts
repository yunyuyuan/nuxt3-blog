// 博客站点。框架代码在 @yunyuyuan/nuxt-blog（本仓库的 layer/ 目录，也以 npm 包发布）中；
// 本目录只放站点自己的文件：config.ts、public/rebuild/ 中的内容、图标等静态资源。
export default defineNuxtConfig({
  extends: ["@yunyuyuan/nuxt-blog"],

  // 开发和测试工具，只用于本仓库
  modules: [
    "@nuxt/eslint",
    "@nuxt/devtools",
    "@nuxt/test-utils/module"
  ],
  devtools: { enabled: true },

  compatibilityDate: "2025-02-15",
  telemetry: false,

  eslint: {
    config: {
      stylistic: {
        quotes: "double",
        commaDangle: "never",
        semi: true,
        braceStyle: "1tbs"
      }
    }
  }
});
