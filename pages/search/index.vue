<script lang="ts" setup>
import { algoliasearch, type Hit } from "algoliasearch";
import debounce from "lodash/debounce.js";
import { HeaderTabs, type AlgoliaBody, type HeaderTabUrl } from "~/utils/common/types";

const input = ref("");
const filter = ref<HeaderTabUrl | undefined>();
const timestamp = ref(0);
const results = ref<Hit<AlgoliaBody>[]>([]);

onMounted(() => {
  const client = algoliasearch(__NB_ALGOLIA_APP_ID, __NB_ALGOLIA_SEARCH_KEY);

  watch(input, debounce(async (input) => {
    const now = Date.now();
    timestamp.value = now;
    const response = await client.searchSingleIndex<AlgoliaBody>({
      indexName: __NB_ALGOLIA_INDEX_NAME,
      searchParams: { query: input }
    });
    if (now === timestamp.value) {
      results.value = response.hits;
    }
  }, 500));
});
</script>

<template>
  <main class="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
    <div class="mx-auto mb-10 max-w-3xl">
      <h1 class="mb-6 text-center text-2xl font-bold text-dark-900 dark:text-white">
        全站搜索
      </h1>
      <div class="relative">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search class="size-5 text-gray-400" />
        </div>
        <input
          type="text"
          placeholder="搜索文章、记录或文化内容..."
          class="block w-full"
        >
      </div>
      <div class="mt-3 flex flex-wrap justify-center gap-2">
        <button :class="twMerge($style.filter, !filter && $style.filterActive)">
          全部
        </button>
        <button
          v-for="tab in HeaderTabs"
          :key="tab.url"
          :class="twMerge($style.filter, !filter && $style.filterActive)"
        >
          {{ $t(tab.name) }}
        </button>
      </div>
    </div>
  </main>
</template>

<style module>
.filter {
  @apply rounded-full bg-dark-100 px-3 py-1 text-sm text-dark-700 transition hover:bg-dark-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700;
}
.filterActive {
  @apply bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-primary-900/30 dark:text-primary-300 dark:hover:bg-primary-800/50;
}
</style>
