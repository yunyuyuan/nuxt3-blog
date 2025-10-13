import { translate } from "../i18n";
import { getCurrentTab, useCommonSEOTitle, deepClone } from "../utils";
import { compareItem, compareMd } from "../manage";
import { notify } from "../notify";
import { useStatusText } from ".";
import type { CommonItem } from "~/utils/common/types";
import { createNewItem } from "~/utils/common/utils";
import { useBlogItem } from "~/utils/hooks/useBlogItem";
import { useStaging } from "~/utils/hooks/useStaging";

// const editingItem = ref() as Ref<CommonItem>;
// const editingMd = ref("");

/**
 * 管理页面详情编辑通用功能
 */
export async function useManageContent<T extends CommonItem>() {
  const itemId = useRoute().params.id as string;
  const unsavedContent = useUnsavedContent();
  const targetTab = getCurrentTab();

  useCommonSEOTitle(computed(() => translate("detail-manage", [translate(targetTab)])));

  const isNew = itemId === "0";

  const blogItemResult = await useBlogItem<T>(itemId, targetTab, false);
  const { originList, decryptedList, originMd, decryptedMd, successDecrypt } = blogItemResult;
  let { originItem, decryptedItem } = blogItemResult;

  if (!originItem) {
    // isNew
    successDecrypt.value = true;
    originItem = createNewItem(targetTab) as T;
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

  // 暂存功能
  const { getStagedItem } = useStaging();

  // 比较是否与原始内容相同
  const sameWithOrigin = computed(() => {
    return compareItem(decryptedItem.value, editingItem.value) && compareMd(decryptedMd.value, editingMd.value);
  });

  const { statusText, canCommit, processing, toggleProcessing } = useStatusText(
    computed(() => !sameWithOrigin.value),
    computed(() => successDecrypt.value)
  );
  const canUpload = computed(() => canCommit.value && !sameWithOrigin.value);

  watchEffect(() => {
    let sameWithStaged = false;
    const currentId = Number(editingItem.value.id);
    const stagedItem = getStagedItem(currentId, targetTab);

    if (stagedItem && compareItem(stagedItem.item, editingItem.value) && compareMd(stagedItem.md, editingMd.value)) {
      sameWithStaged = true;
    }
    unsavedContent.value = !sameWithOrigin.value && !sameWithStaged;
  });

  return {
    targetTab,
    isNew,

    statusText,
    processing,
    toggleProcessing,
    canUpload,
    canDelete: canCommit,

    editingItem,
    editingMd,
    originItem,
    originMd,
    originList,
    decryptedList,
    decryptedItem,
    decryptedMd,

    decrypted: successDecrypt
  };
}

export const hasSameIdOrSlug = (list: CommonItem[]) => {
  // 查找重复的 id
  const idMap = new Map<number, number>();
  list.forEach((item) => {
    const count = idMap.get(item.id) || 0;
    idMap.set(item.id, count + 1);
  });
  for (const [id, count] of idMap.entries()) {
    if (count > 1) {
      return String(id);
    }
  }

  // 查找重复的 customSlug
  const slugMap = new Map<string, number>();
  list.forEach((item) => {
    if (item.customSlug) {
      const count = slugMap.get(item.customSlug) || 0;
      slugMap.set(item.customSlug, count + 1);
    }
  });

  for (const [slug, count] of slugMap.entries()) {
    if (count > 1) {
      return slug;
    }
  }
};

export const editItem = <T extends CommonItem>(originList: Readonly<T[]>, item: T) => {
  const cloneList = originList.map(item => deepClone(item));
  const foundIndex = originList.findIndex(i => i.id === item?.id);
  if (foundIndex < 0) {
    cloneList.splice(0, 0, item);
  } else {
    cloneList.splice(foundIndex, 1, item);
  }
  const duplicateEl = hasSameIdOrSlug(cloneList);
  if (duplicateEl) {
    notify({
      type: "error",
      title: translate("same-id-or-slug-found"),
      description: duplicateEl
    });
  }
  return cloneList;
};

export const deleteItem = <T extends CommonItem>(originList: Readonly<T[]>, item: T) => {
  return deepClone(originList).filter(i => i.id !== item.id);
};
