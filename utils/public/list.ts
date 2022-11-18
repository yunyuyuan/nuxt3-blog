import axios from "axios";
import { processEncryptDescrypt } from "../process-encrypt-descrypt";
import { CommonItem } from "../types";
import { deepClone, devHotListen, fetchList, registerCancelWatchEncryptor } from "../utils";
import { InitialVisitors, isDev, isPrerender } from "./../constants";
import config from "~/config";
import { getVisitorsEvent } from "~/dev-server/types";

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
  watch(pending, async (pend) => {
    if (!pend || isPrerender) {
      resultList.splice(0, 0, ...list.value.map((item) => {
        return deepClone({
          ...item,
          _show: true,
          visitors: InitialVisitors
        }) as T;
      }));
      const query = { type: targetTab.url };
      if (config.MongoDb.enabled) {
        // visitors
        const setVisitors = (data) => {
          try {
            resultList.forEach((item) => {
              item.visitors = data.find(i => i.nid === item.id)?.nvisitors || 0;
            });
          } catch {}
        };

        if (isDev) {
          import.meta.hot.send("get-visitors", query);
          devHotListen(getVisitorsEvent, setVisitors);
        } else {
          axios.post("/api/db/get-visitors", query).then(res => setVisitors(res.data));
        }
      }

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
    }
  }, { immediate: true });

  return {
    list: resultList,
    pending
  };
}
