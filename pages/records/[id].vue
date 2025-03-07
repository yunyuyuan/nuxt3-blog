<script setup lang="ts">
import type { RecordItem } from "~/utils/common/types";
import { formatTime } from "~/utils/nuxt/format-time";
import { translate } from "~/utils/nuxt/i18n";
import { useContentPage } from "~/utils/nuxt/public/detail";
import { Visitors, Comments, WroteDate } from "~/utils/nuxt/components";
import { useCommonSEOTitle } from "~/utils/nuxt/utils";
import { initViewer } from "~/utils/nuxt/viewer";

const { item, htmlContent, markdownRef } = await useContentPage<RecordItem>();
useCommonSEOTitle(computed(() => `${translate("records")}: ${formatTime(item.time, "date")}`));

const root = ref<HTMLElement>();
initViewer(root);
</script>

<template>
  <main
    ref="root"
    class="container mx-auto grow px-4 py-8 max-md:px-2 max-md:py-4 lg:px-8"
  >
    <article class="mx-auto max-w-4xl overflow-hidden rounded-xl bg-white shadow-sm dark:bg-dark-800">
      <div class="px-6 max-md:px-4">
        <div class="my-8 grid grid-cols-1 items-start gap-6 max-md:my-4 md:grid-cols-2">
          <the-lazy-img
            v-for="img, idx in item.images"
            :key="idx"
            :class="$style.img"
            viewer
            :alt="img.alt"
            :src="img.src"
            :title="img.alt"
          />
        </div>

        <article
          ref="markdownRef"
          :class="twMerge('--markdown', 'my-16 max-w-full')"
          v-html="htmlContent"
        />

        <div class="border-t border-dark-100 py-6 dark:border-dark-700">
          <div class="flex items-center space-x-4 text-sm text-dark-500 dark:text-dark-400">
            <div class="flex items-center">
              <WroteDate :item="item" />
            </div>
            <div class="flex items-center">
              <Visitors :visitors="item._visitors" />
            </div>
          </div>
        </div>
      </div>
    </article>

    <div
      v-if="item.showComments"
      class="mx-auto mt-8 max-w-4xl overflow-hidden rounded-xl bg-white p-4 shadow-sm dark:bg-dark-800"
    >
      <Comments />
    </div>
  </main>
</template>

<style module>
.img {
  @apply rounded-lg shadow;

  img {
    @apply object-contain transition-transform duration-500 hover:scale-105;
  }
}
</style>
