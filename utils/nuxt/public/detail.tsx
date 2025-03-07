import config from "~/config";
import { useBlogItem } from "~/utils/hooks/useBlogItem";
import { useMarkdownParser } from "~/utils/hooks/useMarkdownParser";
import type { CommonItem } from "~/utils/common/types";
import { DBOperate } from ".";
import { getCurrentTab, watchUntil } from "../utils";
import { useUnmount } from "~/utils/hooks/useUnmount";

/**
 * 详情页面通用功能
 */
export async function useContentPage<T extends CommonItem> (onAfterInsertHtml?: CallableFunction) {
  const isAuthor = useIsAuthor();
  const githubToken = useGithubToken();
  const targetTab = getCurrentTab();

  const id = useRoute().params.id as string;
  
  const destroyFns = useUnmount();

  const { originList, decryptedItem, decryptedMd } = await useBlogItem<T>(Number(id), targetTab.url);

  const { htmlContent, markdownRef, menuItems } = await useMarkdownParser({ mdValueRef: decryptedMd, onAfterInsertHtml, destroyFns })

  if (decryptedItem.value) {
    watchUntil(isAuthor, () => {
      DBOperate({
        apiPath: "/db/inc-visitors",
        query: {
          id: decryptedItem.value!.id,
          type: targetTab.url,
          inc: config.MongoDb.visitFromOwner || !githubToken.value
        },
        callback: (data) => {
          decryptedItem.value!._visitors = data;
        }
      });
    }, { immediate: true }, isAuthor => isAuthor !== null, "cancelAfterUntil");
  }

  return {
    originList,
    item: decryptedItem.value,
    htmlContent,
    menuItems,
    markdownRef
  };
}
