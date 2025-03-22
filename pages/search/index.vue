<script lang="ts" setup>
import { algoliasearch, type Hit } from "algoliasearch";
import debounce from "lodash/debounce.js";
import { Image, Loader2, Search } from "lucide-vue-next";
import { HeaderTabs, KnowledgeColorMap, KnowledgeIconMap, KnowledgeTabsList, type AlgoliaBody, type HeaderTabUrl, type KnowledgeTab } from "~/utils/common/types";

const input = ref("");
const filter = ref<HeaderTabUrl | undefined>();
const timestamp = ref(0);
const loading = ref(false);
const results = ref<Hit<AlgoliaBody & { type: HeaderTabUrl }>[]>([]);

const filterResults = computed(() => {
  if (!filter.value) return results.value;
  return results.value.filter(item => item.type === filter.value);
});

watch(input, (input) => {
  if (!input) {
    results.value = [];
    loading.value = false;
  } else {
    loading.value = true;
  }
});

onMounted(() => {
  if (!__NB_ALGOLIA_APP_ID || !__NB_ALGOLIA_SEARCH_KEY || !__NB_ALGOLIA_INDEX_NAME) {
    return showError({
      statusCode: 500,
      statusText: "Algolia is not configured!",
      message: "Algolia is not configured!"
    });
  }
  const client = algoliasearch(__NB_ALGOLIA_APP_ID, __NB_ALGOLIA_SEARCH_KEY);

  watch(input, debounce(async (input) => {
    if (!input) {
      return;
    }
    const now = Date.now();
    timestamp.value = now;
    try {
      const response = await client.searchSingleIndex<AlgoliaBody>({
        indexName: __NB_ALGOLIA_INDEX_NAME,
        searchParams: { query: input }
      });
      if (now === timestamp.value) {
        results.value = response.hits.map(hit => ({
          ...hit,
          type: hit.objectID.replace(/\/\d+$/g, "") as HeaderTabUrl
        }));
      }
    } finally {
      loading.value = false;
    }
  }, 500));
});
</script>

<template>
  <main class="container mx-auto max-w-5xl px-4 py-8 max-md:px-1 lg:px-8">
    <div class="mx-auto mb-10 max-w-3xl">
      <h1 class="mb-6 text-center text-2xl font-bold text-dark-900 dark:text-white">
        {{ $t('search-all') }}
      </h1>
      <div class="relative">
        <div class="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
          <Search class="size-5 text-dark-400" />
        </div>
        <input
          v-model="input"
          type="text"
          :placeholder="$t('search-all-placeholder')"
          class="block w-full pl-10"
        >
      </div>
      <div class="mt-3 flex flex-wrap justify-center gap-2">
        <button
          :class="twMerge($style.filter, !filter && $style.filterActive)"
          @click="filter = undefined"
        >
          {{ $t('all') }}
        </button>
        <button
          v-for="tab in HeaderTabs"
          :key="tab"
          :class="twMerge($style.filter, filter === tab && $style.filterActive)"
          @click="filter = tab"
        >
          {{ $t(tab) }}
        </button>
      </div>
    </div>
    <div class="space-y-4">
      <div
        v-if="loading"
        class="mt-12 flex justify-center"
      >
        <Loader2 class="size-8 animate-spin" />
      </div>
      <template v-else-if="filterResults.length">
        <NuxtLink
          v-for="item in filterResults"
          :key="item.objectID"
          :to="item.objectID"
          :class="$style.link"
        >
          <div
            v-if="item.type === '/articles'"
          >
            <div
              class="flex items-start justify-between"
            >
              <div>
                <h2 :class="$style.title">
                  {{ item.title }}
                </h2>
                <div class="mt-1 flex flex-wrap gap-2">
                  <span
                    v-for="tag in (item.metaData as string[])"
                    :key="tag"
                    class="inline-flex items-center rounded-full bg-dark-100 px-2.5 py-0.5 text-xs font-medium text-dark-800 dark:bg-dark-900/30 dark:text-dark-300"
                  >
                    {{ tag }}
                  </span>
                </div>
              </div>
            </div>
            <p :class="$style.content">
              {{ item.content }}
            </p>
          </div>
          <div
            v-else-if="item.type === '/records'"
          >
            <div
              class="flex flex-col md:flex-row"
            >
              <div class="relative size-48 shrink-0 overflow-hidden rounded-lg">
                <the-lazy-img
                  :class="$style.img"
                  :src="item.cover"
                  alt="cover"
                />
                <div class="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent px-3 pb-1.5 pt-4 text-right text-xs">
                  <div class="inline-flex items-center rounded-md bg-black/70 px-1.5 py-1 text-white">
                    <Image class="mr-1 size-4" />
                    <span>{{ item.metaData }}</span>
                  </div>
                </div>
              </div>
              <div class="px-4">
                <h2 :class="$style.title">
                  {{ item.title }}
                </h2>
                <p :class="$style.content">
                  {{ item.content }}
                </p>
              </div>
            </div>
          </div>

          <div
            v-else
          >
            <div
              class="flex flex-col md:flex-row"
            >
              <div class="size-48 shrink-0 overflow-hidden rounded-lg">
                <the-lazy-img
                  :class="$style.img"
                  :src="item.cover"
                  alt="cover"
                />
              </div>
              <div class="px-4">
                <div class="flex items-center gap-1">
                  <div
                    :class="twMerge(
                      'rounded-full px-2.5 py-1 flex items-center text-xs gap-1',
                      KnowledgeColorMap[item.metaData as KnowledgeTab]
                    )"
                  >
                    {{ $t(KnowledgeTabsList.find((i) => i.key === item.metaData)!.name) }}
                    <component
                      :is="KnowledgeIconMap[item.metaData as KnowledgeTab]"
                      class="size-4"
                    />
                  </div>
                  <h2 :class="$style.title">
                    {{ item.title }}
                  </h2>
                </div>
                <p :class="$style.content">
                  {{ item.content }}
                </p>
              </div>
            </div>
          </div>
          <span class="absolute right-4 top-4 text-xs text-dark-500 dark:text-dark-400">
            {{ $t(item.type) }}
          </span>
        </NuxtLink>
      </template>
      <div
        v-else
        class="mt-12 text-center"
      >
        <h3>{{ $t('nothing-here') }}</h3>
      </div>
    </div>
  </main>
</template>

<style module>
.filter {
  @apply rounded-full bg-dark-100 px-3 py-1 text-sm text-dark-700 transition hover:bg-dark-200 dark:bg-dark-800 dark:text-dark-300 dark:hover:bg-dark-700;
}
.filterActive {
  @apply bg-primary-100 text-primary-800 hover:bg-primary-200 dark:bg-primary-900 dark:text-primary-300 dark:hover:bg-primary-800;
}

.link {
  @apply relative block rounded-lg border border-dark-100 bg-white p-6 shadow-sm transition duration-200 hover:shadow-md dark:border-dark-700 dark:bg-dark-800;
  &:hover{
    .title {
      @apply text-primary-600 dark:text-primary-400;
    }
    img {
      @apply scale-105;
    }
  }
}

.title {
  @apply text-xl font-semibold text-dark-900 dark:text-white;
}

.img {
  @apply shadow size-full justify-center;

  img {
    @apply w-full object-cover transition-transform;
  }
}
.content {
  @apply mt-3 line-clamp-5 text-sm text-dark-600 dark:text-dark-300;
}
</style>
