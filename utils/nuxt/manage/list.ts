import type { CommonItem } from "~/utils/common";
import { useBlogList } from "~/utils/hooks/useBlogList";
import { getCurrentTab, translate, useCommonSEOTitle } from "~/utils/nuxt";

/**
 * 管理页面列表通用功能
 */
export async function useManageList<T extends CommonItem> (filterFn: (item: T, search: string) => boolean) {
  const targetTab = getCurrentTab();

  useCommonSEOTitle(computed(() => translate("list-manage", [targetTab.name])));

  const { decryptedList, originList } = await useBlogList<T>(targetTab.url);
  
  const searchValue = ref("");

  return {
    originList: originList,
    list: decryptedList.value,
    targetTab,
    searchValue,
    searchedList: computed(() => {
      return decryptedList.value.filter((item) => {
        return filterFn(item, searchValue.value);
      });
    })
  };
}
