<script setup lang="ts">
import ManageListTable from "~/pages/manage/comps/manage-list-table.vue";
import { type KnowledgeItem, type KnowledgeTab, KnowledgeTabsList } from "~/utils/common";

const filterType = ref<KnowledgeTab>();
const registryFilter = (customFilter: (_: (_item: KnowledgeItem) => boolean) => void) => {
  watch(filterType, () => {
    customFilter((item) => {
      return !filterType.value || item.type === filterType.value;
    });
  });
};

const toggleFilterType = (type?: KnowledgeTab) => {
  filterType.value = filterType.value === type ? undefined : type;
};

const searchFn = (item: KnowledgeItem, s: string) => item.title.includes(s);
</script>

<template>
  <div class="manage-knowledge">
    <manage-list-table
      :registry-filter="registryFilter"
      col-prefix="knowledge-"
      :search-fn="searchFn"
    >
      <template v-if="!!filterType" #filter>
        <span
          class="filter-type flex"
          :title="$t(KnowledgeTabsList.find((i) => i.key === filterType)!.name)"
          @click="toggleFilterType(filterType)"
        >
          <svg-icon :name="filterType!" />
        </span>
      </template>
      <template #title="{ data: title, dataUrl }">
        <nuxt-link no-prefetch :to="dataUrl">
          {{ title }}
        </nuxt-link>
      </template>
      <template #type="{ data: type }">
        <span
          class="filter-type"
          :title="$t(KnowledgeTabsList.find((i) => i.key === type)!.name)"
          @click="toggleFilterType(type)"
        >
          <svg-icon :name="type" />
        </span>
      </template>
    </manage-list-table>
  </div>
</template>

<style lang="scss">
.manage-knowledge {
  .knowledge-title {
    flex-basis: 45%;
    font-weight: bold;
    font-size: f-size();
  }

  .knowledge-type {
    flex-basis: 15%;
  }

  .filter-type {
    cursor: pointer;

    svg {
      @include square(30px);
    }
  }
}
</style>
