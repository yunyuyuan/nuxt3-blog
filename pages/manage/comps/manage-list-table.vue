<script setup lang="ts" generic="T extends CommonItem">
import { deleteList } from "ls:~/utils/nuxt/manage/github";
import { Lock, Plus, Search, Trash2 } from "lucide-vue-next";
import type { CommonItem } from "~/utils/common/types";
import { useStatusText } from "~/utils/nuxt/manage";
import { useManageList } from "~/utils/nuxt/manage/list";
import { formatTime } from "~/utils/nuxt/format-time";

const props = defineProps<{
  filterFn: (item: T, search: string) => boolean;
}>();

const { targetTab, list, originList, decryptedList } = await useManageList<T>();

const searchValue = ref("");

const searchedList = computed(() => {
  return decryptedList.value.filter((item) => {
    return props.filterFn(item, searchValue.value);
  });
});

const slots = defineSlots<Record<string, (_: { item: T; dataUrl: string; key: any }) => void>>();
const header = Object.keys(slots).filter(
  key => !key.startsWith("_")
);

const showConfirmModal = ref<boolean>(false);
const selectedList = reactive<CommonItem[]>([]);

const { statusText, canCommit, processing, toggleProcessing } = useStatusText();

watch([list, searchValue], () => {
  selectedList.splice(0, selectedList.length);
});

const newListToUpdate = computed(() => originList.filter(item =>
  selectedList.find(selected => selected.id === item.id) === undefined
));

const changeSelect = (item: CommonItem) => {
  if (selectedList.includes(item)) {
    selectedList.splice(selectedList.indexOf(item), 1);
  } else {
    selectedList.push(item);
  }
};

const deleteSelect = async () => {
  showConfirmModal.value = false;
  toggleProcessing();
  try {
    await deleteList(newListToUpdate.value, selectedList);
  } finally {
    toggleProcessing();
  }
};
</script>

<template>
  <main class="p-4 max-md:px-2">
    <div class="overflow-hidden">
      <div class="flex flex-wrap items-center gap-2 pb-2">
        <div class="relative grow md:max-w-sm">
          <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Search class="size-5 text-dark-400" />
          </div>
          <input
            v-model="searchValue"
            type="text"
            class="w-full pl-10"
            :placeholder="$t('input-text-to-search')"
          >
        </div>

        <div class="ml-auto flex items-center">
          <span
            v-show="!!statusText"
            class="ml-auto mr-4 text-xs text-red-500"
          >{{ statusText }}</span>

          <div class="flex items-center gap-3">
            <NuxtLink :to="`/manage${targetTab}/new`">
              <CommonButton
                :icon="Plus"
                theme="primary"
                :disabled="!canCommit"
              >
                {{ $t('new') }}
              </CommonButton>
            </NuxtLink>
            <CommonButton
              :icon="Trash2"
              theme="danger"
              :disabled="!canCommit || !selectedList.length"
              :loading="processing"
              data-testid="list-delete-btn"
              @click="showConfirmModal = true"
            >
              {{ $t('del') }}
            </CommonButton>
          </div>
        </div>
      </div>

      <div class="mt-4 overflow-x-auto">
        <table class="min-w-full border-collapse divide-y divide-dark-200 border border-dark-300 dark:divide-dark-700 dark:border-dark-600">
          <thead>
            <tr>
              <th :class="twMerge($style.th, 'max-md:hidden')">
                ID
              </th>
              <th
                v-for="head in header"
                :key="head"
                :class="$style.th"
              >
                {{ $t(head) }}
              </th>
              <th :class="$style.th">
                {{ $t('date') }}
              </th>
              <th :class="twMerge($style.th, 'max-md:hidden')">
                {{ $t('encrypted') }}
              </th>
              <th :class="$style.th">
                {{ $t('select') }}
              </th>
            </tr>
          </thead>
          <tbody
            data-testid="list-items"
            class="divide-y divide-dark-200 bg-white dark:divide-dark-700 dark:bg-dark-800"
          >
            <tr
              v-for="item, idx in searchedList"
              :key="item.id"
              class="transition-colors hover:bg-dark-50 dark:hover:bg-dark-700"
            >
              <td :class="twMerge($style.td, 'max-md:hidden')">
                {{ item.id }}
              </td>
              <slot
                v-for="key, idx1 in header"
                :key="idx1"
                :name="key"
                :item="item"
                :data-url="`/manage${targetTab}/${item.id}`"
              />
              <td :class="twMerge($style.td, 'break-all')">
                {{ formatTime(item.time, 'date') }}
              </td>
              <td :class="twMerge($style.td, 'max-md:hidden')">
                <Lock
                  v-if="item.encrypt"
                  class="mr-1 size-4"
                />
              </td>
              <td :class="$style.td">
                <CommonCheckbox
                  :checked="selectedList.includes(item)"
                  :test-id="`list-item-check-${idx}`"
                  @change="changeSelect(item)"
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </main>

  <common-modal
    v-model="showConfirmModal"
    confirm-theme="danger"
    test-id="confirm-list-delete"
    @confirm="deleteSelect"
  >
    <template #title>
      {{ $t('confirm-delete') }}
    </template>
    <template #body>
      <p v-html="$t('selected-items', [selectedList.length])" />
    </template>
  </common-modal>
</template>

<style module>
.th {
  @apply px-4 py-3 text-left text-sm font-medium break-keep sticky top-0 tracking-wider text-dark-500 dark:text-dark-300 bg-dark-50 dark:bg-dark-700;
}

.td {
  @apply whitespace-nowrap py-6 px-4 text-sm text-dark-500 dark:text-dark-400;
}
</style>
