<script setup lang="ts">
import type { ArticleItem } from "~/utils/common/types";
import { useListPage } from "~/utils/nuxt/public/list";
import { Visitors, Words } from "~/utils/nuxt/public/components";
import { formatTime } from "~/utils/nuxt/format-time";
import { useRouteQuery } from "~/utils/hooks/useRouteQuery";

definePageMeta({
  alias: "/"
});

const tags = useRouteQuery("tag", (tags) => {
  try {
    return tags ? tags.split(",") : [];
  } catch {
    return [];
  }
});

const articlesList = await useListPage<ArticleItem>();

const articleTagList = new Map<string, number>();

watch(articlesList, () => {
  articleTagList.clear();
  articlesList.forEach((item) => {
    item.tags.forEach(v => articleTagList.set(v, (articleTagList.get(v) || 0) + 1));
  });
}, { immediate: true });

const filteredList = computed(() => {
  return articlesList.filter(item =>
    !tags.value.length || tags.value.some(tag => item.tags.includes(tag))
  );
});

const toggleTags = (tag: string) => {
  const newTags = tags.value.slice();
  const searchIdx = newTags.indexOf(tag);
  if (searchIdx > -1) {
    newTags.splice(searchIdx, 1);
  } else {
    newTags.push(tag);
  }
  navigateTo({ query: { tag: newTags.join(",") } }, { replace: true });
};
</script>

<template>
  <main class="container mx-auto max-w-5xl grow px-4 py-8 max-md:px-2">
    <div class="mx-auto max-w-5xl">
      <div class="mb-8">
        <div class="flex flex-wrap gap-2">
          <the-tag
            v-for="[tag, count] in articleTagList"
            :key="tag"
            :num="count"
            :active="tags.includes(tag)"
            @click="toggleTags(tag)"
          >
            {{ tag }}
          </the-tag>
        </div>
      </div>
    </div>

    <div
      v-if="filteredList.length"
      class="space-y-5"
    >
      <article
        v-for="item in filteredList"
        v-show="item._show"
        :key="item.id"
        class="overflow-hidden rounded-xl bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-dark-800"
      >
        <NuxtLink
          :to="'/articles/' + String(item.id)"
          no-prefetch
          class="group block p-6"
        >
          <div class="flex items-start justify-between">
            <h3 class="text-lg font-medium text-dark-900 transition group-hover:text-primary-600 dark:text-white dark:group-hover:text-primary-400">
              {{ item.title }}
            </h3>
            <span
              class="ml-4 whitespace-nowrap text-sm text-dark-500 dark:text-dark-400"
              :title="formatTime(item.time)"
            >
              {{ formatTime(item.time, "date") }}
            </span>
          </div>
          <div class="mt-4 flex items-center space-x-4 text-sm text-dark-500 dark:text-dark-400">
            <Words :len="item.len" />
            <Visitors :visitors="item._visitors" />
          </div>
        </NuxtLink>
      </article>
    </div>
    <div
      v-else
      class="flex items-center justify-center pt-10 text-dark-600 dark:text-dark-400"
    >
      {{ $t('nothing-here') }}
    </div>
  </main>
</template>
