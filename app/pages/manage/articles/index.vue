<script setup lang="ts">
import ManageListTable from "~/pages/manage/comps/manage-list-table.vue";
import type { ArticleItem } from "~/utils/common/types";

const searchFn = (item: ArticleItem, s: string) => {
  return item.title.includes(s);
};
</script>

<template>
  <manage-list-table :filter-fn="searchFn">
    <template #title="{ item: { title }, dataUrl }">
      <td>
        <NuxtLink
          no-prefetch
          :to="dataUrl"
          class="block break-all p-2 text-base text-dark-950 hover:text-primary-700 dark:text-dark-200 dark:hover:text-primary-400"
        >
          {{ title }}
        </NuxtLink>
      </td>
    </template>
    <template #tags="{ item: { tags } }">
      <td>
        <div class="flex flex-wrap gap-1 text-sm">
          <span
            v-for="tag in tags"
            :key="tag"
            class="rounded-full bg-dark-100 px-2.5 py-0.5 text-xs text-dark-800 dark:bg-dark-700 dark:text-dark-300"
          >
            {{ tag }}
          </span>
        </div>
      </td>
    </template>
  </manage-list-table>
</template>
