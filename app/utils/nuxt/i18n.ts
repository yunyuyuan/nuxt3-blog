import type { I18nCode } from "~/utils/common/locales";

export async function getI18nJson(code: I18nCode) {
  const json = await import(`../../../i18n/${code}.json?raw`);
  return JSON.parse(json.default) as Record<string, string>;
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
