<script setup lang="ts">
import { Eye, X } from "lucide-vue-next";
import { commitStagedItems } from "ls:~/utils/nuxt/manage/github";
import type { CommitParamsAddition, CommonItem, HeaderTabUrl } from "~/utils/common/types";
import { fetchList } from "~/utils/nuxt/fetch";
import { translate } from "~/utils/nuxt/i18n";
import { createDiffModal, randomId } from "~/utils/nuxt/manage";
import { notify } from "~/utils/nuxt/notify";
import { deepClone } from "~/utils/nuxt/utils";
import { hasSameIdOrSlug } from "~/utils/nuxt/manage/detail";

const show = defineModel<boolean>({ required: true });

const selectedStagedItems = reactive<typeof stagedItems.value>([]);

const { stagedItems, clearStaging, unstageItem, removeStagedItems } = useStaging();

watch(stagedItems, () => {
  selectedStagedItems.splice(0, selectedStagedItems.length);
  selectedStagedItems.push(...stagedItems.value);
}, { immediate: true });

const handleCommitStaged = async () => {
  try {
    if (selectedStagedItems.length === 0) {
      notify({
        type: "warn",
        title: translate("warning"),
        description: translate("no-staged-items-to-commit")
      });
      return;
    }
    const itemsToCommit = deepClone(selectedStagedItems);

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
        if (!item.id) {
          item.id = randomId(originList);
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

      // 添加JSON文件更新
      additions.push({
        path: `public/rebuild/json${targetTab}.json`,
        content: JSON.stringify(updatedList)
      });

      // 添加markdown文件
      for (const { item, md } of items) {
        additions.push({
          path: `public/rebuild${targetTab}/${item.id}.md`,
          content: md
        });
      }
    }

    const success = await commitStagedItems(additions);
    if (success) {
      notify({
        type: "success",
        title: translate("update-success"),
        description: translate("staged-items-count", [itemsToCommit.length])
      });
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
  }
};

const toggleStagedItemSelection = (item: typeof stagedItems.value[0]) => {
  const index = selectedStagedItems.findIndex(s => s.id === item.id && s.targetTab === item.targetTab);
  if (index >= 0) {
    selectedStagedItems.splice(index, 1);
  } else {
    selectedStagedItems.push(item);
  }
};

const isStagedItemSelected = (item: typeof stagedItems.value[0]) => {
  return selectedStagedItems.some(s => s.id === item.id && s.targetTab === item.targetTab);
};

const peekItemDiff = (id: number, targetTab: HeaderTabUrl) => {
  createDiffModal({ additions: [{
    path: `public/rebuild${targetTab}/${id}.md`,
    content: stagedItems.value.find(s => s.id === id && s.targetTab === targetTab)?.md || ""
  }], showOk: false });
};
</script>

<template>
  <common-modal
    v-model="show"
    confirm-theme="primary"
    modal-width="700px"
    test-id="staged-items-modal"
    ok-test-id="staged-items-modal-ok"
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
            v-for="staged in stagedItems"
            :key="`${staged.targetTab}-${staged.id}`"
            :class="twMerge(
              'rounded-lg border border-dark-200 p-3 dark:border-dark-700 transition-colors',
              isStagedItemSelected(staged) && 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-600'
            )"
          >
            <div class="flex items-center justify-between gap-2">
              <div class="flex grow items-center gap-3">
                <CommonCheckbox
                  :checked="isStagedItemSelected(staged)"
                  @change="toggleStagedItemSelection(staged)"
                />
                <div>
                  <NuxtLink
                    :to="`/manage${staged.targetTab}/${staged.id}`"
                    class="font-medium hover:underline"
                    @click="show = false"
                  >
                    {{ 'title' in staged.item ? staged.item.title : `ID: ${staged.id}` }}
                  </NuxtLink>
                  <div class="text-sm text-dark-500 dark:text-dark-400">
                    {{ $t(staged.targetTab) }} - {{ staged.id }}
                  </div>
                </div>
              </div>
              <button
                class="text-dark-500 hover:text-dark-700"
                :title="$t('preview')"
                @click="peekItemDiff(staged.id, staged.targetTab)"
              >
                <Eye class="size-5" />
              </button>
              <button
                class="text-red-500 hover:text-red-700"
                @click="unstageItem(staged.id, staged.targetTab)"
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
