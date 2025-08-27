import { translate } from "../i18n";
import { getCurrentTab, useCommonSEOTitle } from "../utils";
import type { CommonItem } from "~/utils/common/types";
import { useBlogList } from "~/utils/hooks/useBlogList";

/**
 * 管理页面列表通用功能
 */
export async function useManageList<T extends CommonItem>() {
  const targetTab = getCurrentTab();

  useCommonSEOTitle(computed(() => translate("list-manage", [translate(targetTab)])));

  const { decryptedList, originList } = await useBlogList<T>(targetTab);

  return {
    originList: originList,
    list: decryptedList.value,
    targetTab,
    decryptedList
  };
}
