<script setup lang="ts">
import ManageListTable from "~/pages/manage/comps/manage-list-table.vue";
import type { RecordItem } from "~/utils/common/types";

const searchFn = (item: RecordItem, s: string) => !item.images.length || item.images.some(img => img.alt.includes(s));
</script>

<template>
  <manage-list-table
    :filter-fn="searchFn"
  >
    <template #images="{ item: { images }, dataUrl }">
      <td>
        <nuxt-link
          no-prefetch
          :to="dataUrl"
          :class="$style.a"
        >
          <the-lazy-img
            v-for="img, idx in (images.length ? images : [{ alt: '', src: 'no-poster' }]).slice(0, 6)"
            :key="idx"
            :alt="img.alt"
            :src="img.src"
            :title="img.alt"
            :retry="false"
            :class="$style.img"
          />
        </nuxt-link>
      </td>
    </template>
  </manage-list-table>
</template>

<style module>
.a {
  @apply flex flex-wrap gap-2 py-2;

  &:hover .img img {
    @apply scale-105;
  }
}

.img {
  @apply rounded-sm shadow size-20 justify-center;

  img {
    @apply size-full object-cover duration-500;
  }
}
</style>
