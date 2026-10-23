/**
 * 浏览器端用到的第三方依赖，交给 vite.optimizeDeps.include 预构建。
 *
 * 原因：本 layer 从 npm 安装时，源文件在站点的 node_modules 中。开发模式下 Vite 不扫描
 * node_modules 中的文件，不会自动发现这些依赖。CommonJS 依赖（例如 lodash、dayjs、crypto-js）
 * 没有被预构建成 ESM，浏览器加载时报 "does not provide an export named 'default'"。
 * 生产构建不受影响。本仓库根目录的站点直接使用 layer/ 源码，Vite 会自动发现依赖。
 *
 * 写法必须和源码中的导入路径一致（例如 "lodash/throttle.js"）。
 * client-deps.test.ts 检查 app/ 中的每个第三方导入都在 clientDeps 或 notPrebundled 中。
 */
export const clientDeps = [
  "algoliasearch",
  "clipboard",
  "crypto-js",
  "dayjs",
  "dayjs/plugin/isToday.js",
  "dayjs/plugin/timezone.js",
  "dayjs/plugin/utc.js",
  "dayjs/plugin/weekOfYear.js",
  "js-base64",
  "katex",
  "lodash/debounce.js",
  "lodash/throttle.js",
  "lucide-vue-next",
  "marked",
  "marked-footnote",
  "marked-token-position",
  "mermaid",
  "pangu/browser",
  "shiki",
  "shiki/engine/javascript",
  // 由 nuxt.config.ts 的 imports.presets 自动导入（twMerge），源码中没有 import 语句
  "tailwind-merge",
  "tailwindcss/colors",
  "viewerjs",
  "yaml"
];

/** 不需要预构建的导入 */
export const notPrebundled = [
  // Nuxt 的 optimizeDeps.exclude 中已经排除，都是 ESM
  "vue",
  "ufo",
  // 体积大，nuxt.config.ts 中用 vite.optimizeDeps.exclude 排除
  "monaco-editor",
  // CSS
  "katex/dist/katex.min.css",
  "viewerjs/dist/viewer.css",
  // 只在服务端执行
  "@aws-sdk/client-s3",
  "crypto",
  "fs",
  "tinify"
];
