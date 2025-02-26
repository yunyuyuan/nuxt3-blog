import type { CommonItem } from "~/utils/common";
import { useBlogList } from "~/utils/hooks/useBlogList";
import { getCurrentTab, translate, useCommonSEOTitle } from "~/utils/nuxt";

/**
 * 管理页面列表通用功能
 */
export async function useManageList<T extends CommonItem> () {
  const targetTab = getCurrentTab();

  useCommonSEOTitle(computed(() => translate("list-manage", [targetTab.name])));

  const { decryptedList, originList } = await useBlogList<T>(targetTab.url);
  
  return {
    originList: originList,
    list: decryptedList.value,
    targetTab,
    decryptedList
  };
}
