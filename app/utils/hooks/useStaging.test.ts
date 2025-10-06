import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ArticleItem, HeaderTabUrl } from "../common/types";
import { useStaging, STAGING_KEY, type StagedItem } from "./useStaging";
import { useState } from "#imports";

const localStorageMock = vi.hoisted(() => ({
  getLocalStorage: vi.fn(),
  setLocalStorage: vi.fn(),
  rmLocalStorage: vi.fn()
}));

vi.mock("~/utils/nuxt/localStorage", () => localStorageMock);

const createArticleItem = (overrides: Partial<ArticleItem> = {}): ArticleItem => ({
  id: 1,
  customSlug: "test-slug",
  time: 0,
  modifyTime: 0,
  encrypt: false,
  showComments: true,
  len: 10,
  tags: [],
  title: "Sample title",
  ...overrides
});

describe("useStaging", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useState<boolean>("staging-initialized", () => false).value = false;
    useState<StagedItem<ArticleItem>[]>("staged-items", () => []).value = [];
  });

  it("stages a new item and persists it", () => {
    const { stageItem, stagedItems, isItemStaged, getStagedItem } = useStaging();
    const item = createArticleItem({ id: 101 });
    const target: HeaderTabUrl = "/articles";

    stageItem(item, "draft content", target);

    expect(stagedItems.value).toHaveLength(1);
    expect(getStagedItem<ArticleItem>(item.id, target).md).toBe("draft content");
    expect(isItemStaged(item.id, target)).toBe(true);
    expect(localStorageMock.setLocalStorage).toHaveBeenCalledWith(STAGING_KEY, expect.any(String));
  });

  it("replaces an existing staged item when staging same target", () => {
    const { stageItem, stagedItems } = useStaging();
    const item = createArticleItem({ id: 202 });
    const target: HeaderTabUrl = "/articles";

    stageItem(item, "first draft", target);
    stageItem(item, "revised draft", target);

    expect(stagedItems.value[0]?.md).toBe("revised draft");
    expect(localStorageMock.setLocalStorage).toHaveBeenCalledTimes(2);
  });

  it("unstages items and clears persistence when empty", () => {
    const { stageItem, unstageItem, stagedItems, isItemStaged, hasStaged } = useStaging();
    const item = createArticleItem({ id: 303 });
    const target: HeaderTabUrl = "/articles";

    stageItem(item, "to remove", target);
    expect(hasStaged.value).toBe(true);

    unstageItem(item.id, target);

    expect(stagedItems.value).toHaveLength(0);
    expect(isItemStaged(item.id, target)).toBe(false);
    expect(hasStaged.value).toBe(false);
    expect(localStorageMock.rmLocalStorage).toHaveBeenCalledWith(STAGING_KEY);
  });

  it("removes multiple staged items via removeStagedItems", () => {
    const { stageItem, removeStagedItems, stagedItems } = useStaging();

    stageItem(createArticleItem({ id: 401 }), "first", "/articles");
    stageItem(createArticleItem({ id: 402 }), "second", "/records");

    removeStagedItems([
      { id: 401, targetTab: "/articles" },
      { id: 402, targetTab: "/records" }
    ]);

    expect(stagedItems.value).toHaveLength(0);
    expect(localStorageMock.rmLocalStorage).toHaveBeenCalledWith(STAGING_KEY);
  });

  it("clearStaging empties all staged items", () => {
    const { stageItem, clearStaging, stagedItems } = useStaging();

    stageItem(createArticleItem({ id: 501 }), "content", "/articles");
    clearStaging();

    expect(stagedItems.value).toHaveLength(0);
    expect(localStorageMock.rmLocalStorage).toHaveBeenCalledWith(STAGING_KEY);
  });
});
