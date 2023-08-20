import { CommonItem, HeaderTabUrl, escapeNewLine } from "~/utils/common";

const timestamp = () => useRuntimeConfig().public.timestamp;

export const fetchList = <T extends CommonItem>(tab: HeaderTabUrl) => {
  const filepath = `rebuild/json${tab}.json`;
  return useAsyncData(`${tab}-list`, () => $fetch<T[]>(`/${filepath}?s=${timestamp()}`), {
    default: () => []
  });
};

export const fetchMd = (tab: HeaderTabUrl, id: string) => {
  const filepath = `rebuild${tab}/${id}.md`;
  return useAsyncData(`${tab}-detail-${id}`, () => $fetch<string>(`/${filepath}?s=${timestamp()}`).then(res => escapeNewLine(res)), {
    default: () => ""
  });
};
