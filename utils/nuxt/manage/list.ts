import type { CommonItem } from "~/utils/common/types";
import { useBlogList } from "~/utils/hooks/useBlogList";
import { translate } from "../i18n";
import { getCurrentTab, useCommonSEOTitle } from "../utils";

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
