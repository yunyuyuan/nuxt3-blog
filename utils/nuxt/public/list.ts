import { CommonItem, processEncryptDecrypt } from "~/utils/common";
import { DBOperate, isPrerender, deepClone, fetchList, registerCancelWatchEncryptor, useCurrentTab, watchUntil, translateT } from "~/utils/nuxt";
import config from "~/config";
import { getVisitorsEvent } from "~/vite-plugins/types";
import { VisitorsDb } from "~/lib/api/db/visitors";

/**
 * 列表页面通用功能
 */
export function useListPage<T extends CommonItem> () {
  const githubToken = useGithubToken();
  const encryptor = useEncryptor();

  const targetTab = useCurrentTab();
  const { pending, data: list } = fetchList(targetTab.url);

  useHead({
    title: translateT(targetTab.name) + config.SEO_title
  });

  // cancelWatchPasswd
  const cancelFnList = registerCancelWatchEncryptor();

  const resultList = reactive([]) as T[];
  watchUntil(pending, async () => {
    resultList.splice(0, 0, ...list.value!.map((item) => {
      return deepClone({
        ...item,
        _show: true,
        visitors: 0
      }) as T;
    }));
    DBOperate<VisitorsDb[]>({
      hotEvent: getVisitorsEvent,
      apiPath: "/db/get-visitors",
      query: { type: targetTab.url },
      callback: (data) => {
        resultList.forEach((item) => {
          item.visitors = data.find(i => i.nid === item.id)?.nvisitors || 0;
        });
      }
    });

    // 有token或者密码正确，显示加密的item
    watch([githubToken, encryptor.passwdCorrect], ([hasToken, hasPwd]) => {
      resultList.forEach((item) => {
        item._show = !item.encrypt || (!!hasToken || hasPwd);
      });
    }, { immediate: true });

    // 解密列表数据
    cancelFnList.push(await encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
      for (const item of resultList) {
        if (item.encrypt) {
          await processEncryptDecrypt(item, decrypt, targetTab.url);
        }
      }
    }));
  }, { immediate: true }, pending => !pending || isPrerender, "once");

  return {
    list: resultList,
    pending
  };
}
