import { processEncryptDescrypt } from "../process-encrypt-descrypt";
import { registerCancelWatchEncryptor, createNewItem, deepClone, assignItem, fetchList, fetchMd } from "../utils";
import { useHasModified, useStatusText } from ".";

/**
 * 管理页面详情编辑通用功能
 */
export function useManageContent () {
  const encryptor = useEncryptor();
  const itemId = useRoute().params.id as string;

  const targetTab = useCurrentTab().value;
  const { pending: listPending, data: list } = fetchList(targetTab.url);

  useHead({
    title: `${targetTab.name}详情管理`
  });

  const isNew = itemId === "new";
  const hasDraft = ref<boolean>(false);

  // cancelWatchPasswd
  const cancelFnList = registerCancelWatchEncryptor();

  const originItem = reactive(createNewItem(targetTab.url));
  const draftItem = reactive(createNewItem(targetTab.url));
  const item = reactive(deepClone(toRaw(originItem)));

  const markdownContent = ref<string>("");
  const draftMarkdownContent = ref<string>("");
  // 解密完成 or 上传完成(表面工作)，用来比较是否发生改变的originItem需要更新
  const resetOriginItem = (md: string = undefined) => {
    Object.assign(originItem, deepClone(toRaw(item)));
    if (typeof md !== "undefined") {
      markdownContent.value = md;
    }
  };
  // 保存草稿 or 加载草稿
  const resetDraftItem = (md: string = undefined) => {
    Object.assign(draftItem, deepClone(toRaw(item)));
    if (typeof md !== "undefined") {
      draftMarkdownContent.value = md;
    }
  };

  const decrypted = ref<boolean>(false);
  watch(listPending, async (pend) => {
    if (!pend) {
      if (!isNew) {
        assignItem(originItem, deepClone(list.value.find(item => item.id === Number(itemId))));
        assignItem(item, deepClone(toRaw(originItem)));
        decrypted.value = !item.encrypt;
        // item的内容可以马上解密
        if (item.encrypt) {
          cancelFnList.push(await encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
            await processEncryptDescrypt(item, decrypt, targetTab.url);
            decrypted.value = true;
            resetOriginItem();
          }));
        }
      } else {
        decrypted.value = !item.encrypt;
      }
    }
  }, { immediate: true });

  let mdPending_ = null;
  if (!isNew) {
    const { pending, data: content } = fetchMd(targetTab.url, itemId);
    mdPending_ = pending;
    watch(content, async (markdown: string) => {
      if (markdown) {
        markdownContent.value = markdown.trim();
        // 取到结果后，处理解密
        if (item.encrypt) {
          cancelFnList.push(await encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
            markdownContent.value = await decrypt(markdownContent.value.trim());
          }));
        }
      }
    }, { immediate: true });
  }

  const { hasModified, markdownModified } = useHasModified({ item, origin: originItem });
  // 额外加上是否修改提示
  const pending = computed(() => listPending.value || (mdPending_ && mdPending_.value));
  const { statusText: statusText_, canCommit: canCommit_, processing, toggleProcessing } = useStatusText();
  const canUpload = computed(() => canCommit_.value && hasModified.value);
  const statusText = computed(() => {
    if (pending.value) {
      return "加载中...";
    }
    if (item.encrypt && !decrypted.value) {
      return "请先解密";
    }
    return statusText_.value || (!hasModified.value ? "未修改" : "");
  });

  const { hasModified: hasModifiedForDraft, markdownModified: markdownModifiedForDraft } = useHasModified({ item, origin: draftItem });
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

  return {
    statusText,
    hasDraft,
    markdownModified,
    markdownModifiedForDraft,
    canUpload,
    canDelete: canCommit_,
    processing,
    toggleProcessing,
    resetOriginItem,
    resetDraftItem,
    targetTab,
    list,
    item,
    isNew,
    decrypted,
    markdownContent,
    draftMarkdownContent,
    listPending,
    mdPending: mdPending_,
    pending
  };
}
