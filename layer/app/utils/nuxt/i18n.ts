import type { I18nCode } from "#layers/nuxt3-blog/app/utils/common/locales";

// 语言文件按需加载。不能写 import(`../../../i18n/${code}.json?raw`)：vite 默认不转换
// node_modules 中带变量的动态导入（build.dynamicImportVarsOptions.exclude），而 layer
// 从 npm 安装时位于 node_modules 中，运行时会按相对路径导入而失败。import.meta.glob 没有这个限制
const i18nFiles = import.meta.glob<string>("../../../i18n/*.json", { query: "?raw", import: "default" });

export async function getI18nJson(code: I18nCode) {
  const load = i18nFiles[`../../../i18n/${code}.json`];
  if (!load) {
    throw new Error(`Unknown language: ${code}`);
  }
  return JSON.parse(await load()) as Record<string, string>;
}

export async function loadI18nJson(code: I18nCode) {
  const messages = useNuxtApp().$i18nMessages;
  if (!messages.value[code]) {
    messages.value[code] = await getI18nJson(code);
  }
}

export function translate(name: string, params?: any[], code?: I18nCode): string {
  code = code || useI18nCode().i18nCode.value!;
  const messages = useNuxtApp().$i18nMessages.value[code];
  if (!messages || !messages[name]) {
    return name;
  }
  const regex = /\{(\d+)\}/g;
  return messages[name]?.replace(regex, (_, idx) => (params || [])[+idx]) || name;
}
