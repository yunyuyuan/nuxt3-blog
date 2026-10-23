/* eslint-disable @typescript-eslint/no-require-imports */
const path = require("path");

require("ts-node").register({
  project: path.join(__dirname, "./layer/scripts/tsconfig.json")
});

// 本地脚本（local:*）以站点根目录为工作目录
require("./layer/scripts/gulpfile");
