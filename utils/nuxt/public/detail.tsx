import { formatTime, DBOperate, translate, getCurrentTab, watchUntil, literalTime } from "~/utils/nuxt";
import config from "~/config";
import "./detail.scss";
import SvgIcon from "~/components/svg-icon.vue";
import { useBlogItem } from "~/utils/hooks/useBlogItem";
import { useMarkdownParser } from "~/utils/hooks/useMarkdownParser";
import type { CommonItem } from "~/utils/common/types";

/**
 * 详情页面通用功能
 */
export async function useContentPage<T extends CommonItem> (onAfterInsertHtml?: CallableFunction) {
  const isAuthor = useIsAuthor();
  const githubToken = useGithubToken();
  const targetTab = getCurrentTab();

  const id = useRoute().params.id as string;
  
  const { decryptedItem, decryptedMd } = await useBlogItem<T>(Number(id), targetTab.url);
  
  if (!decryptedItem.value) {
    throw ""
  }

  const { htmlContent, markdownRef, menuItems } = useMarkdownParser({ mdValueRef: decryptedMd, onAfterInsertHtml })

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
          decryptedItem.value!.visitors = data;
        }
      });
    }, { immediate: true }, isAuthor => isAuthor !== null, "cancelAfterUntil");
  }

  return {
    item: decryptedItem.value,
    htmlContent,
    wroteDate: wroteDate(decryptedItem.value.time, decryptedItem.value.modifyTime),
    menuItems,
    markdownRef
  };
}

function wroteDate (time: number, modifyTime: number) {
  const fuzzyMode = ref(true);
  return defineComponent({
    render: () => (
      <div class="write-date flex" onClick={() => (fuzzyMode.value = !fuzzyMode.value)}>
        <SvgIcon name="write" />
        <div class="flexc">
          {
            fuzzyMode.value &&
              <span>{ literalTime(time) }</span>
          }
          {
            !fuzzyMode.value &&
              <>
                <span>{translate("created-at")}: {formatTime(time)}</span>
                <span>{translate("updated-at")}: {formatTime(modifyTime)}</span>
              </>
          }
        </div>
      </div>
    )
  });
}
