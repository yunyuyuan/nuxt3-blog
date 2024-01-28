import * as common from "~/utils/common";
import { formatTime, DBOperate, translate, afterInsertHtml, parseMarkdown, assignItem, useCurrentTab, fetchList, fetchMd, watchUntil } from "~/utils/nuxt";
import config from "~/config";

/**
 * 详情页面通用功能
 */
export async function useContentPage<T extends common.CommonItem> () {
  const encryptor = useEncryptor();
  const isAuthor = useIsAuthor();
  const markdownRef = ref<HTMLElement>();
  const githubToken = useGithubToken();
  const targetTab = useCurrentTab();

  const id = useRoute().params.id as string;

  const item = reactive(common.createNewItem(targetTab.url)) as T;

  // 所有页面都有markdown
  const mdContent = ref<string>("");
  const htmlContent = ref<string>("");
  const menuItems = ref<Awaited<ReturnType<typeof parseMarkdown>>["menu"]>([]);
  // 所有页面都有发布时间与更新时间
  const publishTime = computed(() => formatTime(item.time));
  const modifyTime = computed(() => formatTime(item.modifyTime));

  let destroyFns: ReturnType<typeof afterInsertHtml> = [];

  onBeforeUnmount(() => {
    destroyFns.forEach(fn => fn());
  });

  const list = await fetchList(targetTab.url);
  const foundItem = list.find(item => item.id === Number(id));
  if (!foundItem) {
    showError({ statusCode: 404, fatal: true });
  } else {
    assignItem(item, foundItem);
    item.visitors = 0;
  }
  if (item.encrypt) {
    encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
      await common.processEncryptDecrypt(item, decrypt, targetTab.url);
    });
  }
  mdContent.value = await fetchMd(targetTab.url, id);
  if (item.encrypt) {
    encryptor.decryptOrWatchToDecrypt(
      async (decrypt) => {
        const result = await parseMarkdown(await decrypt(mdContent.value));
        htmlContent.value = result.md;
        menuItems.value = result.menu;
      },
      () => {
        htmlContent.value = mdContent.value;
      }
    );
  } else if (item.encryptBlocks) {
    watch(githubToken, async (logined) => {
      let newMarkdownContent = mdContent.value;
      for (const block of item.encryptBlocks!) {
        const { start, end } = block;
        newMarkdownContent = logined
        // 如果已登录：给block显示为sticker表情
          ? newMarkdownContent.slice(0, start) + translate("encrypted-content") + "![sticker](aru/59)" + newMarkdownContent.slice(end)
        // 如果未登录：直接隐藏block
          : newMarkdownContent.slice(0, start - 10) + newMarkdownContent.slice(end + 11);
      }
      const result = await parseMarkdown(newMarkdownContent);
      htmlContent.value = result.md;
      menuItems.value = result.menu;
      encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
        let newMarkdownContent = mdContent.value;
        for (const block of item.encryptBlocks!) {
          const { start, end } = block;
          newMarkdownContent = newMarkdownContent.slice(0, start) + await decrypt(newMarkdownContent.slice(start, end)) + newMarkdownContent.slice(end);
        }
        const result = await parseMarkdown(newMarkdownContent);
        htmlContent.value = result.md;
        menuItems.value = result.menu;
      });
    }, { immediate: true });
  } else {
    const result = await parseMarkdown(mdContent.value);
    htmlContent.value = result.md;
    menuItems.value = result.menu;
  }

  if (item.id) {
    watchUntil(isAuthor, () => {
      DBOperate({
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

  return {
    item,
    tabUrl: targetTab.url,
    htmlContent,
    menuItems,
    publishTime,
    modifyTime,
    markdownRef,
    htmlInserted
  };
}
