export const i18nLocales = [
  {
    code: "en",
    iso: "en-US",
    file: "en.json",
    name: "English",
    formatFull: "MM/DD/YYYY HH:mm:ss",
    formatDate: "MM/DD/YYYY",
    formatMonth: "MM/DD"
  },
  {
    code: "zh",
    iso: "zh-CN",
    file: "zh.json",
    name: "中文",
    formatFull: "YYYY-MM-DD HH:mm:ss",
    formatDate: "YYYY-MM-DD",
    formatMonth: "MM.DD"
  }
] as const;

export const allLocales = i18nLocales.map(item => item.code);
export type I18nCode = typeof allLocales[number];

export const getLocaleByCode = (code: typeof allLocales[number]) => {
  return i18nLocales.find(locale => locale.code === code);
};
