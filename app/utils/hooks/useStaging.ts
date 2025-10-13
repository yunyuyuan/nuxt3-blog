import type { CommonItem, HeaderTabUrl } from "~/utils/common/types";
import { getLocalStorage, setLocalStorage, rmLocalStorage } from "~/utils/nuxt/localStorage";

export interface StagedItem<T extends CommonItem> {
  item: T;
  md: string;
  targetTab: HeaderTabUrl;
  id: number;
}

export const STAGING_KEY = "nb-staged-items";

export const useStaging = () => {
  // 暂存的项目列表，使用标志位确保只初始化一次
  const isInitialized = useState("staging-initialized", () => false);
  const stagedItems = useState<StagedItem<CommonItem>[]>("staged-items", () => []);
  const inStaging = computed(() => stagedItems.value.length > 0);

  // 从 localStorage 加载暂存的项目
  const loadStagedItems = (): StagedItem<CommonItem>[] => {
    // 确保在客户端执行
    if (import.meta.client) {
      const stored = getLocalStorage(STAGING_KEY);
      if (stored) {
        try {
          return JSON.parse(stored);
        } catch {
          return [];
        }
      }
    }
    return [];
  };

  // 保存暂存项目到 localStorage
  const saveStagedItems = (items: StagedItem<CommonItem>[]) => {
    // 确保在客户端执行
    if (items.length > 0) {
      setLocalStorage(STAGING_KEY, JSON.stringify(items));
    } else {
      rmLocalStorage(STAGING_KEY);
    }
  };

  // 在客户端初始化暂存项目
  const initializeStagedItems = () => {
    if (!isInitialized.value) {
      const loadedItems = loadStagedItems();
      stagedItems.value = loadedItems;
      isInitialized.value = true;
    }
  };

  // 暂存一个项目
  const stageItem = <T extends CommonItem>(item: T, md: string, targetTab: HeaderTabUrl) => {
    const existingIndex = stagedItems.value.findIndex(staged =>
      staged.id === item.id && staged.targetTab === targetTab
    );

    const stagedItem: StagedItem<T> = {
      item,
      md,
      targetTab,
      id: item.id
    };

    if (existingIndex >= 0) {
      stagedItems.value.splice(existingIndex, 1, stagedItem);
    } else {
      stagedItems.value.push(stagedItem);
    }

    // 保存到 localStorage
    saveStagedItems(stagedItems.value);
  };

  // 移除暂存的项目
  const unstageItem = (id: number, targetTab: HeaderTabUrl) => {
    const index = stagedItems.value.findIndex(staged =>
      staged.id === id && staged.targetTab === targetTab
    );
    if (index >= 0) {
      stagedItems.value.splice(index, 1);
    }

    // 保存到 localStorage
    saveStagedItems(stagedItems.value);
  };

  // 清空所有暂存
  const clearStaging = () => {
    stagedItems.value = [];
    // 清空 localStorage
    saveStagedItems([]);
  };

  // 检查项目是否已暂存
  const isItemStaged = (id: number, targetTab: string) => {
    return stagedItems.value.some(staged =>
      staged.id === id && staged.targetTab === targetTab
    );
  };

  // 获取指定项目的暂存内容
  const getStagedItem = <T extends CommonItem>(id: number, targetTab: string) => {
    return stagedItems.value.find(staged =>
      staged.id === id && staged.targetTab === targetTab
    ) as StagedItem<T>;
  };

  // 检查是否有暂存内容
  const hasStaged = computed(() => stagedItems.value.length > 0);

  // 删除指定项目的暂存
  const deleteStagedItem = (id: number, targetTab: HeaderTabUrl) => {
    unstageItem(id, targetTab);
  };

  // 移除指定的暂存项目（批量）
  const removeStagedItems = (itemsToRemove: Pick<StagedItem<CommonItem>, "id" | "targetTab">[]) => {
    for (const item of itemsToRemove) {
      unstageItem(item.id, item.targetTab);
    }
  };

  return {
    inStaging,
    stagedItems,
    hasStaged,
    stageItem,
    unstageItem,
    clearStaging,
    isItemStaged,
    getStagedItem,
    deleteStagedItem,
    removeStagedItems,
    initializeStagedItems
  };
};
