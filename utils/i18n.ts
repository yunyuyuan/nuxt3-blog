/**
 * 翻译
 */
export function translate (...args: any[]): string {
  return useNuxtApp().$i18n.t(...args);
}
export function translateT (...args: any[]): string {
  return useNuxtApp().$T(...args);
}
export function translateTT (...args: any[]): string {
  return useNuxtApp().$TT(...args);
}
