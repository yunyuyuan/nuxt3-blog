import { type CommonItem } from "~/utils/common/types";
import { useBlogList } from "~/utils/hooks/useBlogList";
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

  useCommonSEOTitle(computed(() => translate(targetTab.name)));

  const { decryptedList } = await useBlogList<T>(targetTab.url);

  DBOperate<any[]>({
    apiPath: "/db/get-visitors",
    query: { type: targetTab.url },
    callback: (data) => {
      decryptedList.value.forEach((item) => {
        item._visitors = data.find(i => i.nid === item.id)?.nvisitors || 0;
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
