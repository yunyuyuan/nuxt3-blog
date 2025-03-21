<script lang="ts" setup>
import { algoliasearch } from "algoliasearch";
import debounce from "lodash/debounce.js";
import type { AlgoliaBody } from "~/utils/common/types";

const input = ref("");

onMounted(() => {
  const client = algoliasearch(__NB_ALGOLIA_APP_ID, __NB_ALGOLIA_SEARCH_KEY);

  watch(input, debounce(async (input) => {
    console.log("start");
    const response = await client.searchSingleIndex<AlgoliaBody>({
      indexName: __NB_ALGOLIA_INDEX_NAME,
      searchParams: { query: input }
    });
    console.log(response.hits);
  }, 500));
});
</script>

<template>
  <div>
    <input v-model="input">
  </div>
</template>
