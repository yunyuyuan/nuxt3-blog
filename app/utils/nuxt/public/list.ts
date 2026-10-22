import { type CommonItem } from "~/utils/common/types";
import { decryptListWith } from "~/utils/hooks/useBlogList";
import { fetchList } from "~/utils/nuxt/fetch";
import { DBOperate } from ".";
import { translate } from "../i18n";
import { getCurrentTab, useCommonSEOTitle } from "../utils";

/**
 * 列表页面通用功能
 */
export async function useListPage<T extends CommonItem> () {
  const githubToken = useGithubToken();
  const encryptor = useEncryptor();
  const targetTab = getCurrentTab();

  useCommonSEOTitle(computed(() => translate(targetTab)));

  // 列表进入 payload：水合时不再请求 json
  const { data } = await useAsyncData(`list:${targetTab}`, () => fetchList<T>(targetTab));
  const { decryptedList } = await decryptListWith(encryptor, data.value ?? [], targetTab);

  DBOperate<any[]>({
    apiPath: "/db/get-visitors",
    query: { type: targetTab },
    callback: (data) => {
      decryptedList.value.forEach((item) => {
        item._visitors = data.find(i => i[0] === item.id)?.[2] || 0;
      });
    }
  });

  // 有token或者密码正确，显示加密的item
  watch([githubToken, encryptor.passwdCorrect], ([hasToken, hasPwd]) => {
    decryptedList.value.forEach((item) => {
      item._show = !item.encrypt || (!!hasToken || hasPwd);
    });
  }, { immediate: true });

  return decryptedList.value;
}
