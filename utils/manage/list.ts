import { processEncryptDescrypt } from "../process-encrypt-descrypt";
import { CommonItem } from "../types";
import { registerCancelWatchEncryptor, deepClone, useCurrentTab, fetchList, watchUntil } from "../utils";
import { translate } from "../i18n";
import { isPrerender } from "./../constants";
import config from "~/config";

/**
 * 管理页面列表通用功能
 */
export function useManageList<T extends CommonItem> () {
  const encryptor = useEncryptor();

  const targetTab = useCurrentTab();
  const { pending, data: list } = fetchList<T>(targetTab.url);

  useHead({
    title: translate("list-manage", [targetTab.name]) + config.SEO_title
  });

  // cancelWatchPasswd
  const cancelFnList = registerCancelWatchEncryptor();

  const resultList = reactive([]) as T[];
  watchUntil(pending, async () => {
    resultList.splice(0, resultList.length, ...list.value!.map((item) => {
      return deepClone({
        ...item,
        _show: true
      });
    }));
    // 解密列表数据
    cancelFnList.push(await encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
      for (const item of resultList) {
        if (item.encrypt) {
          await processEncryptDescrypt(item, decrypt, targetTab.url);
        }
      }
    }));
  }, { immediate: true }, pending => !pending || isPrerender, "once");

  // filter
  const customFilter = (filter: (_: T) => boolean) => {
    resultList.forEach((item) => {
      item._show = filter(item as T);
    });
  };

  return {
    list: resultList,
    targetTab,
    pending,
    customFilter
  };
}
