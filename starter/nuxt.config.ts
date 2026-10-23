// 博客站点。框架代码在 npm 包 @yunyuyuan/nuxt-blog 中；
// 本目录只放站点自己的文件：config.ts、public/rebuild/ 中的内容、图标等静态资源。
export default defineNuxtConfig({
  extends: ["@yunyuyuan/nuxt-blog"],
  compatibilityDate: "2025-02-15",
  telemetry: false
});
