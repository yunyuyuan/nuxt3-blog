import { marked } from "marked";
import { CommonItem, createNewItem, processEncryptDecrypt } from "~/utils/common";
import { parseMarkdown, formatTime, DBOperate, isPrerender, translate, afterInsertHtml, parseMarkdownSync, registerCancelWatchEncryptor, assignItem, useCurrentTab, fetchList, fetchMd, watchUntil } from "~/utils/nuxt";
import config from "~/config";
import { incVisitorsEvent } from "~/vite-plugins/types";

/**
 * 详情页面通用功能
 */
export function useContentPage<T extends CommonItem> () {
  const route = useRoute();
  const encryptor = useEncryptor();
  const markdownRef = ref<HTMLElement>();
  const githubToken = useGithubToken();

  const id = route.params.id as string;

  const targetTab = useCurrentTab();
  const { pending: listPending, data: list } = fetchList(targetTab.url);

  const item = reactive(createNewItem(targetTab.url)) as T;

  // cancelWatchPasswd
  const cancelFnList = registerCancelWatchEncryptor();
  let destroyFns: ReturnType<typeof afterInsertHtml> = [];

  watchUntil(listPending, async () => {
    const foundItem = list.value!.find(item => item.id === Number(id));
    if (!foundItem) {
      showError({ statusCode: 404, fatal: true });
    } else {
      assignItem(item, foundItem);
      item.visitors = 0;
    }
    if (item.encrypt) {
      cancelFnList.push(await encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
        await processEncryptDecrypt(item, decrypt, targetTab.url);
      }));
    }
  }, { immediate: true }, pending => !pending || isPrerender, "once");

  // 所有页面都有markdown
  const mdContent = ref<string>("");
  const htmlContent = ref<string>("");
  const { pending, data: content } = fetchMd(targetTab.url, id);

  watch([listPending, pending, githubToken], ([listPend, pend, logined]) => {
    if ((!listPend && !pend) || isPrerender) {
      mdContent.value = content.value as string;
      if (item.encrypt) {
        encryptor.decryptOrWatchToDecrypt(
          async (decrypt) => {
            htmlContent.value = await parseMarkdown(await decrypt(mdContent.value));
          },
          () => {
            htmlContent.value = mdContent.value;
          }
        ).then((cancelFn) => {
          cancelFnList.push(cancelFn);
        });
      } else if (item.encryptBlocks) {
        let newMarkdownContent = mdContent.value;
        for (const block of item.encryptBlocks) {
          const { start, end } = block;
          newMarkdownContent = logined
            // 如果已登录：给block显示为sticker表情
            ? newMarkdownContent.slice(0, start) + translate("encrypted-content") + "![sticker](aru/59)" + newMarkdownContent.slice(end)
            // 如果未登录：直接隐藏block
            : newMarkdownContent.slice(0, start - 10) + newMarkdownContent.slice(end + 11);
        }
        if (isPrerender) {
          htmlContent.value = parseMarkdownSync(newMarkdownContent, marked);
        } else {
          parseMarkdown(newMarkdownContent).then((res) => {
            htmlContent.value = res;
          });
        }
        encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
          let newMarkdownContent = mdContent.value;
          for (const block of item.encryptBlocks!) {
            const { start, end } = block;
            newMarkdownContent = newMarkdownContent.slice(0, start) + await decrypt(newMarkdownContent.slice(start, end)) + newMarkdownContent.slice(end);
          }
          htmlContent.value = await parseMarkdown(newMarkdownContent);
        }).then((cancelFn) => {
          cancelFnList.push(cancelFn);
        });
      } else if (isPrerender) {
        htmlContent.value = parseMarkdownSync(mdContent.value, marked);
      } else {
        parseMarkdown(mdContent.value).then((res) => {
          htmlContent.value = res;
        });
      }
      if (item.id) {
        watchUntil(useIsAuthor(), () => {
          DBOperate({
            hotEvent: incVisitorsEvent,
            apiPath: "/db/inc-visitors",
            query: {
              id: item.id,
              type: targetTab.url,
              inc: config.MongoDb.visitFromOwner || !githubToken.value
            },
            callback: (data) => {
              item.visitors = data;
            }
          });
        }, { immediate: true }, isAuthor => isAuthor !== null, "once");
      }
    }
  }, { immediate: true });

  const htmlInserted = ref<boolean>(false);
  // 监听htmlContent变化，处理afterInsertHTML
  watch(htmlContent, () => {
    if (markdownRef.value) {
      destroyFns = afterInsertHtml(markdownRef.value, false, htmlInserted);
    }
  });

  onBeforeUnmount(() => {
    destroyFns.forEach(fn => fn());
  });

  // 所有页面都有发布时间与更新时间
  const publishTime = computed(() => formatTime(item.time));
  const modifyTime = computed(() => formatTime(item.modifyTime));

  return {
    item,
    tabUrl: targetTab.url,
    htmlContent,
    publishTime,
    modifyTime,
    markdownRef,
    mdPending: computed(() => !htmlContent.value),
    htmlInserted,
    listPending
  };
}
