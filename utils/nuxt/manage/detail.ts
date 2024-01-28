import { createNewItem, type CommonItem, processEncryptDecrypt } from "~/utils/common";
import { useHasModified, translate, useStatusText, useCurrentTab, deepClone, assignItem, fetchList, fetchMd, useCommonSEOTitle } from "~/utils/nuxt";

/**
 * 管理页面详情编辑通用功能
 */
export async function useManageContent<T extends CommonItem> () {
  const encryptor = useEncryptor();
  const itemId = useRoute().params.id as string;
  const targetTab = useCurrentTab();

  useCommonSEOTitle(computed(() => translate("detail-manage", [targetTab.name])));

  const isNew = itemId === "new";

  const originItem = reactive(createNewItem(targetTab.url)) as T;
  const draftItem = reactive(createNewItem(targetTab.url)) as T;
  const item = reactive(deepClone(originItem)) as T;

  const blockDecrypted = ref(false);
  const markdownContent = ref("");
  const draftMarkdownContent = ref("");

  const hasDraft = ref(false);
  const itemDecrypted = ref(false);
  const mdDecrypted = ref(false);
  const decrypted = computed(() => itemDecrypted.value && mdDecrypted.value);

  let list: T[] = [];

  const { hasModified, markdownModified } = useHasModified<T>({ item, origin: originItem });
  // 额外加上是否修改提示
  const { statusText: statusText_, canCommit, processing, toggleProcessing } = useStatusText();
  const canUpload = computed(() => canCommit.value && hasModified.value);
  const statusText = computed(() => {
    if (item.encrypt && !decrypted.value) {
      return translate("need-decrypt");
    }
    return statusText_.value || (!hasModified.value ? translate("not-modified") : "");
  });

  const { hasModified: hasModifiedForDraft, markdownModified: markdownModifiedForDraft } = useHasModified<T>({ item, origin: draftItem });
  // 提示未保存内容
  watch([hasModified, hasDraft, hasModifiedForDraft], ([modified, hasDraft, draftModified]) => {
    // 和origin，草稿对得上一个就行了
    let modified_ = true;
    if (hasDraft) {
      if (!modified || !draftModified) {
        modified_ = false;
      }
    } else if (!modified) {
      modified_ = false;
    }
    useUnsavedContent().value = modified_;
  });

  // 解密完成 or 上传完成(表面工作)，用来比较是否发生改变的originItem需要更新
  const resetOriginItem = (md?: string) => {
    Object.assign(originItem, deepClone(item));
    if (typeof md !== "undefined") {
      markdownContent.value = md;
    }
  };
  // 保存草稿 or 加载草稿
  const resetDraftItem = (md?: string) => {
    Object.assign(draftItem, deepClone(item));
    if (typeof md !== "undefined") {
      draftMarkdownContent.value = md;
    }
  };

  list = await fetchList<T>(targetTab.url);

  if (!isNew) {
    assignItem<T>(originItem, deepClone(list.find(item => item.id === Number(itemId))!));
    assignItem<T>(item, deepClone(originItem));
    // item的内容可以马上解密
    if (item.encrypt) {
      encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
        await processEncryptDecrypt(item, decrypt, targetTab.url);
        itemDecrypted.value = true;
        resetOriginItem();
      });
    } else {
      itemDecrypted.value = true;
    }
  } else {
    itemDecrypted.value = true;
    blockDecrypted.value = true;
  }

  if (!isNew) {
    const markdown = await fetchMd(targetTab.url, itemId);
    markdownContent.value = markdown.trim() || "";
    // 取到结果后，处理解密
    if (item.encrypt) {
      blockDecrypted.value = true;
      encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
        markdownContent.value = (await decrypt(markdownContent.value)).trim();
        mdDecrypted.value = true;
      });
    } else if (item.encryptBlocks) {
      mdDecrypted.value = true;
      encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
        let newMarkdownContent = markdownContent.value;
        for (const block of item.encryptBlocks!) {
          const { start, end } = block;
          newMarkdownContent = newMarkdownContent.slice(0, start) + await decrypt(newMarkdownContent.slice(start, end)) + newMarkdownContent.slice(end);
        }
        markdownContent.value = newMarkdownContent;
        blockDecrypted.value = true;
      });
    } else {
      mdDecrypted.value = true;
      blockDecrypted.value = true;
    }
  } else {
    mdDecrypted.value = true;
  }

  return {
    statusText,
    hasDraft,
    markdownModified,
    markdownModifiedForDraft,
    canUpload,
    canDelete: canCommit,
    processing,
    toggleProcessing,
    resetOriginItem,
    resetDraftItem,
    targetTab,
    list,
    item,
    isNew,
    decrypted,
    blockDecrypted,
    markdownContent,
    draftMarkdownContent
  };
}
