<script setup lang="ts">
import { ArrowUp, Edit, Eye, Image, Plus, Trash } from "lucide-vue-next";
import ManageContentEdit from "~/pages/manage/comps/manage-content-edit.vue";
import type { RecordItem } from "~/utils/common/types";
import { getUniqueId } from "~/utils/common/utils";
import { initViewer } from "~/utils/nuxt/viewer";

const editing = ref(true);
const imagesEl = ref<HTMLElement>();

const preProcessItem = (_: Ref<RecordItem>) => { };

const moveUpImg = (idx: number, item: RecordItem) => {
  item.images.splice(idx - 1, 2, item.images[idx]!, item.images[idx - 1]!);
};
const rmImg = (idx: number, item: RecordItem) => {
  item.images.splice(idx, 1);
};
const addImg = (item: RecordItem) => {
  item.images.push({ src: "", alt: "", id: getUniqueId() });
};

initViewer(imagesEl);
</script>

<template>
  <manage-content-edit :pre-process-item="preProcessItem">
    <template #images="{ disabled, item }">
      <div>
        <span :class="item.images.some(img => !img.src) && 'form-item-invalid'">
          <Image class="size-5" />
          {{ $t('images') }}
        </span>
        <div
          ref="imagesEl"
        >
          <div
            v-if="!editing"
            class="flex flex-wrap gap-2"
          >
            <the-lazy-img
              v-for="(img, idx) in item.images"
              :key="idx"
              viewer
              :alt="img.alt"
              :src="img.src"
              :title="img.alt"
              :class="$style.previewImg"
            />
          </div>
          <div
            v-else
            class="flex flex-col"
          >
            <div
              v-for="(img, idx) in item.images"
              :key="img.id"
              class="mb-2 flex gap-2"
            >
              <input
                v-model="img.src"
                class="max-w-[400px] shrink md:w-[40vw]"
                :disabled="disabled"
                placeholder="src"
              >
              <input
                v-model="img.alt"
                class="w-20"
                :disabled="disabled"
                placeholder="alt"
              >
              <div class="flex gap-1">
                <button
                  v-if="idx !== 0"
                  :disabled="disabled"
                  class="icon-button"
                  @click="moveUpImg(idx, item)"
                >
                  <ArrowUp class="size-5" />
                </button>
                <button
                  :disabled="disabled"
                  class="icon-button"
                  @click="rmImg(idx, item)"
                >
                  <Trash class="size-5 text-red-400 dark:text-red-600" />
                </button>
              </div>
            </div>
          </div>
          <div class="mt-2 flex gap-2">
            <CommonButton
              :disabled="disabled"
              :icon="Plus"
              @click="addImg(item)"
            />
            <CommonButton
              :disabled="disabled"
              :icon="editing ? Eye : Edit"
              @click="editing = !editing"
            />
          </div>
        </div>
      </div>
    </template>
  </manage-content-edit>
</template>

<style module>
.previewImg {
  @apply size-48 rounded-lg max-md:w-full max-md:h-[unset];

  img {
    @apply size-full md:object-cover;
  }
}
</style>
