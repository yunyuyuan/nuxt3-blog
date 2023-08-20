import { CommonItem, createNewItem, processEncryptDecrypt } from "~/utils/common";
import { formatTime, inBrowser, DBOperate, translate, afterInsertHtml, parseMarkdownSync, assignItem, useCurrentTab, fetchList, fetchMd, watchUntil } from "~/utils/nuxt";
import config from "~/config";
import { incVisitorsEvent } from "~/vite-plugins/types";

/**
 * 详情页面通用功能
 */
export async function useContentPage<T extends CommonItem> () {
  const nuxtApp = useNuxtApp();
  const route = useRoute();
  const encryptor = useEncryptor();
  const isAuthor = useIsAuthor();
  const markdownRef = ref<HTMLElement>();
  const githubToken = useGithubToken();
  const targetTab = useCurrentTab();

  const id = route.params.id as string;

  const item = reactive(createNewItem(targetTab.url)) as T;

  // 所有页面都有markdown
  const mdContent = ref<string>("");
  const htmlContent = ref<string>("");
  // 所有页面都有发布时间与更新时间
  const publishTime = computed(() => formatTime(item.time));
  const modifyTime = computed(() => formatTime(item.modifyTime));

  let destroyFns: ReturnType<typeof afterInsertHtml> = [];

  await nuxtApp.runWithContext(async () => {
    const { data: list } = await fetchList(targetTab.url);
    const foundItem = list.value.find(item => item.id === Number(id));
    if (!foundItem) {
      showError({ statusCode: 404, fatal: true });
    } else {
      assignItem(item, foundItem);
      item.visitors = 0;
    }
  });
  if (item.encrypt) {
    encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
      await processEncryptDecrypt(item, decrypt, targetTab.url);
    });
  }
  await nuxtApp.runWithContext(async () => {
    const { data: md } = await fetchMd(targetTab.url, id);
    mdContent.value = md.value;
  });
  if (item.encrypt) {
    encryptor.decryptOrWatchToDecrypt(
      async (decrypt) => {
        htmlContent.value = parseMarkdownSync(await decrypt(mdContent.value));
      },
      () => {
        htmlContent.value = mdContent.value;
      }
    );
  } else if (item.encryptBlocks) {
    watch(githubToken, (logined) => {
      let newMarkdownContent = mdContent.value;
      for (const block of item.encryptBlocks!) {
        const { start, end } = block;
        newMarkdownContent = logined
        // 如果已登录：给block显示为sticker表情
          ? newMarkdownContent.slice(0, start) + translate("encrypted-content") + "![sticker](aru/59)" + newMarkdownContent.slice(end)
        // 如果未登录：直接隐藏block
          : newMarkdownContent.slice(0, start - 10) + newMarkdownContent.slice(end + 11);
      }
      htmlContent.value = parseMarkdownSync(mdContent.value);
      encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
        let newMarkdownContent = mdContent.value;
        for (const block of item.encryptBlocks!) {
          const { start, end } = block;
          newMarkdownContent = newMarkdownContent.slice(0, start) + await decrypt(newMarkdownContent.slice(start, end)) + newMarkdownContent.slice(end);
        }
        htmlContent.value = parseMarkdownSync(newMarkdownContent);
      });
    });
  } else {
    nuxtApp.runWithContext(() => {
      htmlContent.value = parseMarkdownSync(mdContent.value);
    });
  }

  if (item.id && inBrowser) {
    watchUntil(isAuthor, () => {
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

  const htmlInserted = ref<boolean>(false);
  // 监听htmlContent变化，处理afterInsertHTML
  watch(htmlContent, () => {
    setTimeout(() => {
      if (markdownRef.value) {
        destroyFns = afterInsertHtml(markdownRef.value, false, htmlInserted);
      }
    });
  }, { immediate: true });

  onBeforeUnmount(() => {
    destroyFns.forEach(fn => fn());
  });

  return {
    item,
    tabUrl: targetTab.url,
    htmlContent,
    publishTime,
    modifyTime,
    markdownRef,
    htmlInserted
  };
}
