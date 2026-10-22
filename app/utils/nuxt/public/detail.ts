import config from "~~/config";
import { useBlogItem } from "~/utils/hooks/useBlogItem";
import { useMarkdownParser } from "~/utils/hooks/useMarkdownParser";
import type { CommonItem } from "~/utils/common/types";
import { markdownExcerpt } from "~/utils/common/utils";
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

  const { originList, decryptedItem, decryptedMd } = await useBlogItem<T>(id, targetTab);

  const { htmlContent, markdownRef, menuItems } = await useMarkdownParser({ mdValueRef: decryptedMd, onAfterInsertHtml, destroyFns })

  if (decryptedItem.value) {
    watchUntil(isAuthor, () => {
      DBOperate({
        apiPath: "/db/inc-visitors",
        query: {
          id: decryptedItem.value!.id,
          type: targetTab,
          inc: config.database.visitFromOwner || !githubToken.value
        },
        callback: (data) => {
          decryptedItem.value!._visitors = data;
        }
      });
    }, { immediate: true }, isAuthor => isAuthor !== null, "cancelAfterUntil");
  }

  // meta description：整篇加密的条目不暴露任何内容；知识库优先用自己的 summary
  const description = computed(() => {
    const item = decryptedItem.value;
    if (!item || item.encrypt) {
      return undefined;
    }
    if ("summary" in item && item.summary) {
      return item.summary;
    }
    return markdownExcerpt(decryptedMd.value) || undefined;
  });

  return {
    originList,
    item: decryptedItem.value,
    htmlContent,
    menuItems,
    markdownRef,
    description
  };
}
