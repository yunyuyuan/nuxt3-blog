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
        <nuxt-link
          no-prefetch
          :to="dataUrl"
          class="block break-all p-2 text-base text-dark-950 hover:text-primary-700 dark:text-dark-200 dark:hover:text-primary-400"
        >
          {{ title }}
        </nuxt-link>
      </td>
    </template>
    <template #tags="{ item: { tags } }">
      <td>
        <div class="flex flex-wrap gap-1 text-sm">
          <span
            v-for="tag in tags"
            :key="tag"
            class="rounded-lg bg-dark-100 px-1.5 py-0.5 text-dark-700 dark:bg-dark-700 dark:text-dark-300"
          >
            {{ tag }}
          </span>
        </div>
      </td>
    </template>
  </manage-list-table>
</template>
