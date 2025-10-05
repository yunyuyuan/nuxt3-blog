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
  <main class="relative mx-auto max-w-6xl grow px-4 py-8 max-md:px-3">
    <div class="relative mx-auto max-w-4xl space-y-10">
      <section
        v-if="articleTagList.size"
        class="rounded-3xl border border-transparent bg-white/70 p-6 shadow-card ring-1 ring-dark-100/70 backdrop-blur-md transition dark:bg-dark-900/50 dark:ring-dark-700"
      >
        <header class="mb-4 flex flex-wrap items-baseline justify-between gap-3">
          <h2 class="text-sm font-medium text-dark-700 dark:text-dark-200 max-md:text-xs">
            {{ $t('tags') }}
          </h2>
          <span class="text-[13px] text-dark-400 dark:text-dark-400">{{ filteredList.length }} {{ $t('articles-num') }}</span>
        </header>
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
      </section>

      <section
        v-if="filteredList.length"
        class="space-y-6"
      >
        <article
          v-for="item in filteredList"
          v-show="item._show"
          :key="item.id"
          class="group relative overflow-hidden rounded-3xl border border-dark-100/70 bg-white/80 p-6 shadow-card transition-all duration-300 hover:-translate-y-1 hover:border-primary-400 hover:bg-white dark:border-dark-700 dark:bg-dark-900/60 dark:hover:border-primary-500"
        >
          <NuxtLink
            :to="`/articles/${item.customSlug || item.id}`"
            no-prefetch
            class="flex flex-col gap-4"
          >
            <div class="flex flex-wrap items-start justify-between gap-4">
              <h3 class="title-text max-w-xl transition group-hover:text-primary-600 dark:group-hover:text-primary-400">
                {{ item.title }}
              </h3>
              <span
                class="text-sm text-dark-400 transition group-hover:text-primary-500 dark:text-dark-400 dark:group-hover:text-primary-300"
                :title="formatTime(item.time)"
              >
                {{ formatTime(item.time, "date") }}
              </span>
            </div>
            <div
              v-if="item.tags.length"
              class="flex flex-wrap gap-2"
            >
              <span
                v-for="innerTag in item.tags"
                :key="innerTag"
                class="rounded-full border border-dark-100/80 px-3 py-1 text-[12px] text-dark-500 transition group-hover:border-primary-200 group-hover:text-primary-600 dark:border-dark-700 dark:text-dark-300 dark:group-hover:border-primary-400"
              >
                {{ innerTag }}
              </span>
            </div>
            <div class="flex flex-wrap items-center gap-4 text-[13px] text-dark-500 dark:text-dark-300">
              <Words :len="item.len" />
              <Visitors :visitors="item._visitors" />
            </div>
          </NuxtLink>
        </article>
      </section>

      <section
        v-else
        class="flex items-center justify-center rounded-3xl border border-dashed border-dark-100/80 py-20 text-sm text-dark-500 dark:border-dark-700 dark:text-dark-300"
      >
        {{ $t('nothing-here') }}
      </section>
    </div>
  </main>
</template>
