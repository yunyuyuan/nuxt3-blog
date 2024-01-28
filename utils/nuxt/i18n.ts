import capitalize from "lodash/capitalize";
import type { I18nCode } from "~/utils/common";

export async function loadI18nJson (code: I18nCode) {
  const messages = useNuxtApp().$i18nMessages;
  if (!messages.value[code]) {
    const json = await import(`../../i18n/${code}.json?raw`);
    messages.value[code] = JSON.parse(json.default);
  }
}

export function translate (name: string, params?: any[], code?: I18nCode): string {
  code = code || useI18nCode().i18nCode.value!;
  const messages = useNuxtApp().$i18nMessages.value;
  if (!messages[code] || !messages[code][name]) {
    return name;
  }
  const regex = /\{(\d+)\}/g;
  return messages[code]![name].replace(regex, (_, idx) => (params || [])[+idx]);
}
export function translateT (...args: Parameters<typeof translate>): string {
  return capitalize(translate(...args));
}
export function translateTT (...args: Parameters<typeof translate>): string {
  return translate(...args).toUpperCase();
}
