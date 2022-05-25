import { processEncryptDescrypt } from "../process-encrypt-descrypt";
import { CommonItem } from "../types";
import { registerCancelWatchEncryptor, deepClone } from "../utils";
import { TargetTab } from "~/plugins/target-tab";

/**
 * 管理页面列表通用功能
 */
export function useManageList () {
  const encryptor = useEncryptor();
  const { targetTab, pending, list }: TargetTab = useNuxtApp().$targetTab.value;

  useHead({
    title: `${targetTab.name}列表管理`
  });

  // cancelWatchPasswd
  const cancelFnList = registerCancelWatchEncryptor();

  const resultList = reactive([]) as CommonItem[];
  watch(pending, async (pend) => {
    if (!pend) {
      resultList.splice(0, resultList.length, ...list.value.map((item) => {
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
    }
  }, { immediate: true });

  // filter
  const customFilter = (filter: (_: CommonItem) => boolean) => {
    resultList.forEach((item) => {
      item._show = filter(item);
    });
  };

  return {
    list: resultList,
    targetTab,
    pending,
    customFilter
  };
}
