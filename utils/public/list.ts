import { processEncryptDescrypt } from "../process-encrypt-descrypt";
import { CommonItem } from "../types";
import { deepClone, fetchList, registerCancelWatchEncryptor, watchUntil } from "../utils";
import { isPrerender } from "./../constants";
import { DBOperate } from ".";
import config from "~/config";
import { getVisitorsEvent } from "~/dev-server/types";
import { VisitorsDb } from "~~/lib/api/db/visitors";

/**
 * 列表页面通用功能
 */
export default function useListPage<T extends CommonItem> () {
  const githubToken = useGithubToken();
  const encryptor = useEncryptor();

  const targetTab = useCurrentTab().value;
  const { pending, data: list } = fetchList(targetTab.url);

  useHead({
    title: targetTab.name + config.SEO_title
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
          await processEncryptDescrypt(item, decrypt, targetTab.url);
        }
      }
    }));
  }, { immediate: true }, pending => !pending || isPrerender, "once");

  return {
    list: resultList,
    pending
  };
}
