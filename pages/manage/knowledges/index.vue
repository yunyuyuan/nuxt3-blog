<script setup lang="ts">
import ManageListTable from "~/pages/manage/comps/manage-list-table.vue";
import { KnowledgeColorMap, KnowledgeIconMap, type KnowledgeItem, KnowledgeTabsList } from "~/utils/common/types";

const searchFn = (item: KnowledgeItem, s: string) => {
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
    <template #type="{ item: { type } }">
      <td>
        <span
          :title="$t(KnowledgeTabsList.find((i) => i.key === type)!.name)"
          :class="twMerge(
            'inline-flex items-center rounded-full bg-blue-100 p-1.5 font-medium',
            KnowledgeColorMap[type]
          )"
        >
          <component
            :is="KnowledgeIconMap[type]"
            class="size-5"
          />
        </span>
      </td>
    </template>
  </manage-list-table>
</template>
