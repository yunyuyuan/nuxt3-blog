import { type CommonItem, processEncryptDecrypt } from "~/utils/common";
import { deepClone, useCurrentTab, fetchList, translate, useCommonSEOTitle } from "~/utils/nuxt";

/**
 * 管理页面列表通用功能
 */
export async function useManageList<T extends CommonItem> () {
  const encryptor = useEncryptor();
  const targetTab = useCurrentTab();

  useCommonSEOTitle(computed(() => translate("list-manage", [targetTab.name])));

  const list = await fetchList<T>(targetTab.url);

  const resultList = reactive([]) as T[];
  resultList.splice(0, 0, ...list.map((item) => {
    return deepClone({
      ...item,
      _show: true
    }) as T;
  }));
  // 解密列表数据
  encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
    for (const item of resultList) {
      if (item.encrypt) {
        await processEncryptDecrypt(item, decrypt, targetTab.url);
      }
    }
  });

  // filter
  const customFilter = (filter: (_: T) => boolean) => {
    resultList.forEach((item) => {
      item._show = filter(item as T);
    });
  };

  return {
    list: resultList,
    targetTab,
    customFilter
  };
}
