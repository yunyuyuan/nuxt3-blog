import { beforeEach, describe, expect, it } from "vitest";
import type { ArticleItem, HeaderTabUrl } from "../common/types";
import { getLocalStorage } from "../nuxt/localStorage";
import { useDraft } from "./useDraft";
import { deepClone } from "~/utils/nuxt/utils";

const TestItem: ArticleItem = {
  id: 1234,
  time: 0,
  modifyTime: 0,
  encrypt: false,
  showComments: true,
  title: "test",
  len: 2000,
  tags: ["tag1", "tag2"]
};

const TestMd = "test";

function createTestRefs() {
  const originItem = ref(deepClone(TestItem));
  const originMd = ref(TestMd);
  const editingItem = ref(deepClone(TestItem));
  const editingMd = ref(TestMd);

  return {
    originItem,
    originMd,
    editingItem,
    editingMd,
    url: "/articles" as HeaderTabUrl
  };
}

describe("Test Draft", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("save draft should success", () => {
    const refs = createTestRefs();
    const { draftKey, hasDraft, saveDraft } = useDraft({
      originItem: refs.originItem,
      editingItem: refs.editingItem,
      originMd: refs.originMd,
      editingMd: refs.editingMd,
      url: refs.url
    });
    saveDraft();
    expect(hasDraft.value).toBeTruthy();
    expect(getLocalStorage(draftKey.value)).toBeTruthy();
  });

  it("hasDraft should be false when draft be deleted", () => {
    const refs = createTestRefs();
    const { draftKey, hasDraft, saveDraft, deleteDraft } = useDraft({
      originItem: refs.originItem,
      editingItem: refs.editingItem,
      originMd: refs.originMd,
      editingMd: refs.editingMd,
      url: refs.url
    });

    saveDraft();
    deleteDraft();
    expect(hasDraft.value).toBeFalsy();
    expect(getLocalStorage(draftKey.value)).toBeFalsy();
  });

  it("apply should successful", () => {
    const refs = createTestRefs();
    const { saveDraft, applyDraft } = useDraft({
      originItem: refs.originItem,
      editingItem: refs.editingItem,
      originMd: refs.originMd,
      editingMd: refs.editingMd,
      url: refs.url
    });

    saveDraft();
    refs.editingItem.value.title = "changed";
    refs.editingMd.value = "also changed";
    applyDraft();
    expect(refs.editingItem.value).toEqual(TestItem);
    expect(refs.editingMd.value).toEqual(TestMd);
  });

  it("canSaveLeave should work", () => {
    const refs = createTestRefs();
    const { canSaveLeave, saveDraft, applyDraft, deleteDraft } = useDraft({
      originItem: refs.originItem,
      editingItem: refs.editingItem,
      originMd: refs.originMd,
      editingMd: refs.editingMd,
      url: refs.url
    });

    expect(canSaveLeave.value).toBeTruthy();
    refs.editingItem.value.title = "changed";
    expect(canSaveLeave.value).toBeFalsy();
    saveDraft();
    expect(canSaveLeave.value).toBeTruthy();
    refs.editingMd.value = "also changed";
    expect(canSaveLeave.value).toBeFalsy();
    applyDraft();
    expect(canSaveLeave.value).toBeTruthy();
    deleteDraft();
    expect(canSaveLeave.value).toBeFalsy();
    refs.editingItem.value.title = refs.originItem.value.title;
    expect(canSaveLeave.value).toBeTruthy();

    refs.editingItem.value.title = "changed";
    refs.editingMd.value = "also changed";
    refs.originItem.value.title = "changed";
    expect(canSaveLeave.value).toBeFalsy();
    refs.originMd.value = "also changed";
    expect(canSaveLeave.value).toBeTruthy();
  });
});
