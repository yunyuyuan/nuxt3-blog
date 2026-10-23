import rebuild from "./rebuild";

// rebuild 只在开发模式注册：后台的“提交”改写本地文件
export const allPlugins = [rebuild];
export const buildPlugins = [];
