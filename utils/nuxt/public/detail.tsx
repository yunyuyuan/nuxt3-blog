import { formatTime, literalTime } from "~/utils/nuxt/format-time";
import config from "~/config";
import "./detail.scss";
import SvgIcon from "~/components/svg-icon.vue";
import { useBlogItem } from "~/utils/hooks/useBlogItem";
import { useMarkdownParser } from "~/utils/hooks/useMarkdownParser";
import type { CommonItem } from "~/utils/common/types";
import { DBOperate } from ".";
import { translate } from "../i18n";
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

  const { decryptedItem, decryptedMd } = await useBlogItem<T>(Number(id), targetTab.url);

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
