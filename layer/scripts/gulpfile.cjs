/* eslint-disable @typescript-eslint/no-require-imports */
// 站点 gulpfile.js 的入口：require("@yunyuyuan/nuxt-blog/scripts/gulpfile.cjs")
// 任务的源码是 TypeScript。从 npm 安装时，layer 位于 node_modules 中，
// ts-node 默认不编译 node_modules 中的文件，所以用 jiti 加载。
// 任务注册在站点安装的 gulp 上（gulp 是 peer 依赖），gulp-cli 才能找到它们。
const { createJiti } = require("jiti");

createJiti(__filename)("./gulpfile.ts");
