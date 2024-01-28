<script setup lang="ts">
import ManageListTable from "~/pages/manage/comps/manage-list-table.vue";
import { type RecordItem } from "~/utils/common";

const searchFn = (item: RecordItem, s:string) => !item.images.length || item.images.some(img => img.alt.includes(s));
</script>

<template>
  <div class="manage-record">
    <manage-list-table
      col-prefix="record-"
      :search-fn="searchFn"
    >
      <template #images="{ data: images, dataUrl }">
        <nuxt-link no-prefetch :to="dataUrl">
          <the-lazy-img
            v-for="img,idx in (images.length ? images : [{alt: '', src: 'no-poster'}])"
            :key="idx"
            :container-size="[50, 50]"
            :alt="img.alt"
            :src="img.src"
            :title="img.alt"
            :retry="false"
            :err-size="{width: '100px', height: '100px'}"
          />
        </nuxt-link>
      </template>
    </manage-list-table>
  </div>
</template>

<style lang="scss">
.manage-record {
  .record-images {
    flex-basis: 60%;

    a {
      display: flex;
      align-items: center;
      flex-wrap: wrap;

      .--lazy-img {
        margin-bottom: 6px;
        transition: box-shadow $animation-duration $animation-function;

        &:not(:last-of-type) {
          margin-right: 6px;
        }
      }

      &:hover {
        .--lazy-img {
          box-shadow: 0 0 8px rgb(0 0 0 / 20%);
        }
      }

      img {
        height: 100px;
      }
    }
  }
}
</style>
