<script setup lang="ts">
import { Eye, X } from "lucide-vue-next";
import { commitStagedItems } from "#layers/nuxt3-blog/app/utils/nuxt/manage/repository";
import type { CommitParamsAddition, CommonItem, HeaderTabUrl } from "#layers/nuxt3-blog/app/utils/common/types";
import { fetchList } from "#layers/nuxt3-blog/app/utils/nuxt/fetch";
import { translate } from "#layers/nuxt3-blog/app/utils/nuxt/i18n";
import { createDiffModal, randomId } from "#layers/nuxt3-blog/app/utils/nuxt/manage";
import { notify } from "#layers/nuxt3-blog/app/utils/nuxt/notify";
import { deepClone } from "#layers/nuxt3-blog/app/utils/nuxt/utils";
import { hasSameIdOrSlug } from "#layers/nuxt3-blog/app/utils/nuxt/manage/detail";
import { itemFileAddition } from "#layers/nuxt3-blog/app/utils/nuxt/manage/item-processor";
import { useStaging } from "#layers/nuxt3-blog/app/utils/hooks/useStaging";

const show = defineModel<boolean>({ required: true });

const loading = ref(false);
const selectedStagedItems = reactive<{ targetTab: HeaderTabUrl; id: number }[]>([]);

const { stagedItems, clearStaging, unstageItem, removeStagedItems } = useStaging();

watch(show, () => {
  if (show.value) {
    selectedStagedItems.splice(0, selectedStagedItems.length);
    selectedStagedItems.push(...stagedItems.value.map(item => ({ targetTab: item.targetTab, id: item.id })));
  }
}, { immediate: true });

const handleCommitStaged = async () => {
  try {
    if (selectedStagedItems.length === 0) {
      notify({
        type: "warn",
        title: translate("warning"),
        description: translate("select-items-to-commit")
      });
      return;
    }
    const itemsToCommit = deepClone(toRaw(stagedItems.value).filter(item => selectedStagedItems.some(s => s.id === item.id && s.targetTab === item.targetTab)));

    // 按targetTab分组
    const groupedItems = new Map<string, Array<{ item: CommonItem; md: string }>>();
    for (const staged of itemsToCommit) {
      if (!groupedItems.has(staged.targetTab)) {
        groupedItems.set(staged.targetTab, []);
      }
      groupedItems.get(staged.targetTab)!.push({ item: staged.item, md: staged.md });
    }

    const additions: CommitParamsAddition[] = [];

    // 处理每个tab的项目
    for (const [targetTab, items] of groupedItems) {
      // 获取原始列表
      const originList = await fetchList(targetTab as HeaderTabUrl);

      // 更新列表
      const updatedList = [...originList];
      for (const { item } of items) {
        // 兼容旧版本以 id=0 暂存的新条目；用 updatedList 生成，避免同一批新条目 id 冲突
        if (!item.id) {
          item.id = randomId(updatedList);
        }
        const foundIndex = updatedList.findIndex(i => i.id === item.id);
        if (foundIndex >= 0) {
          updatedList.splice(foundIndex, 1, item);
        } else {
          updatedList.unshift(item);
        }
      }

      const duplicateEl = hasSameIdOrSlug(updatedList);
      if (duplicateEl) {
        return notify({
          type: "error",
          title: translate("same-id-or-slug-found"),
          description: duplicateEl
        });
      }

      // 每个条目一个文件；索引在构建时生成
      for (const { item, md } of items) {
        additions.push(itemFileAddition(targetTab as HeaderTabUrl, item, md));
      }
    }

    loading.value = true;
    const success = await commitStagedItems(additions);
    if (success) {
      if (selectedStagedItems.length > 0) {
        removeStagedItems(selectedStagedItems);
        selectedStagedItems.splice(0);
      } else {
        clearStaging();
      }
      show.value = false;
    }
  } catch (error) {
    notify({
      type: "error",
      title: translate("error"),
      description: String(error)
    });
  } finally {
    loading.value = false;
  }
};

const toggleStagedItemSelection = (item: typeof stagedItems.value[number]) => {
  const index = selectedStagedItems.findIndex(s => s.id === item.id && s.targetTab === item.targetTab);
  if (index >= 0) {
    selectedStagedItems.splice(index, 1);
  } else {
    selectedStagedItems.push({ targetTab: item.targetTab, id: item.id });
  }
};

const isStagedItemSelected = (item: typeof stagedItems.value[number]) => {
  return selectedStagedItems.some(s => s.id === item.id && s.targetTab === item.targetTab);
};

const peekItemDiff = async (id: number, targetTab: HeaderTabUrl) => {
  const staged = stagedItems.value.find(s => s.id === id && s.targetTab === targetTab);
  if (!staged) {
    return;
  }
  // 对比整个条目文件（frontmatter + 正文）；原文由 diff 弹窗读取
  createDiffModal({
    additions: [itemFileAddition(targetTab, staged.item, staged.md)],
    showOk: false
  });
};
</script>

<template>
  <common-modal
    v-model="show"
    confirm-theme="primary"
    modal-width="700px"
    test-id="staged-items-modal"
    ok-test-id="staged-items-modal-ok"
    :loading="loading"
    @confirm="handleCommitStaged"
  >
    <template #title>
      <span>{{ $t('staged-items-preview') }}</span>
    </template>
    <template #body>
      <div class="space-y-4">
        <div class="flex items-center justify-between">
          <p>{{ $t('staged-items-count', [stagedItems.length]) }}</p>
        </div>
        <div class="max-h-60 space-y-2 overflow-y-auto">
          <div
            v-for="item in stagedItems"
            :key="`${item.targetTab}-${item.id}`"
            :class="twMerge(
              'rounded-lg border border-dark-200 p-3 dark:border-dark-700 transition-colors',
              isStagedItemSelected(item) && 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600'
            )"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex grow items-center gap-3">
                <CommonCheckbox
                  :checked="isStagedItemSelected(item)"
                  @change="toggleStagedItemSelection(item)"
                />
                <div>
                  <NuxtLink
                    :to="`/manage${item.targetTab}/${item.id}`"
                    class="font-medium hover:underline"
                    @click="show = false"
                  >
                    {{ 'title' in item.item ? item.item.title : `ID: ${item.id}` }}
                  </NuxtLink>
                  <div class="text-sm text-dark-500 dark:text-dark-400">
                    {{ $t(item.targetTab) }} - {{ item.id }}
                  </div>
                </div>
              </div>
              <button
                class="text-dark-500 hover:text-dark-700"
                :title="$t('preview')"
                @click="peekItemDiff(item.id, item.targetTab)"
              >
                <Eye class="size-5" />
              </button>
              <button
                class="text-red-500 hover:text-red-700"
                @click="unstageItem(item.id, item.targetTab)"
              >
                <X class="size-5" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </template>
  </common-modal>
</template>
