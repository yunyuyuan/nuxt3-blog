import { type CommonItem } from "#layers/nuxt3-blog/app/utils/common/types";
import { decryptListWith } from "#layers/nuxt3-blog/app/utils/hooks/useBlogList";
import { fetchList } from "#layers/nuxt3-blog/app/utils/nuxt/fetch";
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

  // 访客数：条目 id -> 次数。加载完成前为空，页面不显示
  const visitors = ref<Record<number, number>>({});
  DBOperate<any[]>({
    apiPath: "/db/get-visitors",
    query: { type: targetTab },
    callback: (data) => {
      visitors.value = Object.fromEntries(decryptedList.value.map(item => [item.id, data.find(i => i[0] === item.id)?.[2] || 0]));
    }
  });

  // 有token或者密码正确，显示加密的item
  const showEncrypted = computed(() => !!githubToken.value || encryptor.passwdCorrect.value);
  const isShown = (item: CommonItem) => !item.encrypt || showEncrypted.value;

  return { list: decryptedList.value, visitors, isShown };
}
