import { createNewItem, type CommonItem } from "~/utils/common";
import { useBlogItem } from "~/utils/hooks/useBlogItem";
import { useDraft } from "~/utils/hooks/useDraft";
import { translate, useStatusText, getCurrentTab, deepClone, useCommonSEOTitle } from "~/utils/nuxt";

/**
 * 管理页面详情编辑通用功能
 */
export async function useManageContent<T extends CommonItem> () {
  const itemId = useRoute().params.id as string;
  const targetTab = getCurrentTab();

  useCommonSEOTitle(computed(() => translate("detail-manage", [targetTab.name])));

  const isNew = itemId === "new";

  const blogItemResult = await useBlogItem<T>(Number(itemId), targetTab.url);
  const { originList, decryptedList, originMd, decryptedMd, successDecrypt } = blogItemResult;
  let { originItem, decryptedItem } = blogItemResult;

  if (!originItem) {
    // isNew
    successDecrypt.value = true;
    originItem = createNewItem(targetTab.url) as T;
    decryptedItem = readonly(ref(deepClone(originItem))) as Readonly<Ref<T>>;
  }
  
  const editingItem = ref() as Ref<T>;
  const editingMd = ref("");
  
  watch(decryptedMd, (decryptedMd) => {
    editingMd.value = decryptedMd;
  }, { immediate: true });

  watch(decryptedItem, (decryptedItem) => {
    editingItem.value = deepClone(decryptedItem);
  }, { immediate: true, deep: true });

  const { canSaveLeave, hasDraft, sameWithOrigin, saveDraft, deleteDraft, applyDraft } = useDraft({
    originItem: decryptedItem,
    originMd: readonly(decryptedMd),
    editingItem,
    editingMd,
    url: targetTab.url
  });

  const { statusText, canCommit, processing, toggleProcessing } = useStatusText(
    computed(() => !sameWithOrigin.value),
    computed(() => originItem.encrypt && !successDecrypt.value)
  );
  const canUpload = computed(() => canCommit.value && !sameWithOrigin.value);

  watch(canSaveLeave, canSaveLeave => {
    useUnsavedContent().value = !canSaveLeave;
  });

  return {
    targetTab,
    isNew,

    statusText,
    processing,
    toggleProcessing,
    canUpload,
    canDelete: canCommit,

    hasDraft,
    saveDraft,
    deleteDraft,
    applyDraft,

    editingItem,
    editingMd,
    originItem,
    originMd,
    originList,
    decryptedList,
    decryptedItem,
    decryptedMd,
    
    decrypted: successDecrypt,
  };
}
