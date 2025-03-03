import type { CommonItem, HeaderTabUrl } from "../common/types";
import { getLocalStorage, setLocalStorage, rmLocalStorage } from "../nuxt/localStorage";
import { compareItem, compareMd } from "../nuxt/manage";

export interface UseDraftProps<T extends CommonItem> {
  originItem: Readonly<Ref<T>>;
  originMd: Readonly<Ref<string>>;
  editingItem: Ref<T>;
  editingMd: Ref<string>;
  url: HeaderTabUrl;
}

export const useDraft = <T extends CommonItem>({
  originItem,
  originMd,
  editingItem,
  editingMd,
  url
}: UseDraftProps<T>) => {
  const draftKey = computed(() => `draft-${url}-${originItem.value.id}`);

  const hasDraft = ref(false);

  const draftItem = ref<T>();
  const draftMd = ref("");

  const sameWithDraft = computed(() => {
    return draftItem.value && compareItem(draftItem.value, editingItem.value) && compareMd(draftMd.value, editingMd.value);
  });
  const sameWithOrigin = computed(() => {
    return compareItem(originItem.value, editingItem.value) && compareMd(originMd.value, editingMd.value);
  });

  const canSaveLeave = computed(() => {
    return sameWithDraft.value || sameWithOrigin.value;
  });

  const loadDraft = () => {
    const draft = getLocalStorage(draftKey.value);
    if (draft) {
      try {
        const { content, ...rest } = JSON.parse(draft);
        draftMd.value = content;
        draftItem.value = rest;
      } catch { /**  */ }
    } else {
      draftMd.value = "";
      draftItem.value = undefined;
    }
    hasDraft.value = Boolean(draft);
  };

  const saveDraft = () => {
    setLocalStorage(draftKey.value, JSON.stringify({
      ...editingItem.value,
      content: editingMd.value
    }));
    loadDraft();
  };
  const deleteDraft = () => {
    rmLocalStorage(draftKey.value);
    loadDraft();
  };
  const applyDraft = () => {
    if (draftItem.value) {
      editingItem.value = draftItem.value;
    }
    editingMd.value = draftMd.value;
  };

  loadDraft();

  return {
    draftKey,
    hasDraft,
    canSaveLeave,
    sameWithDraft,
    sameWithOrigin,
    saveDraft,
    deleteDraft,
    applyDraft
  };
};
