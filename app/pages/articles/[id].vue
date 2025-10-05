<script setup lang="ts">
import { addScrollListener, rmScrollListener } from "~/utils/common/scroll-event";
import type { ArticleItem } from "~/utils/common/types";
import { useContentPage } from "~/utils/nuxt/public/detail";
import { Comments, Visitors, WroteDate } from "~/utils/nuxt/public/components";
import { useCommonSEOTitle } from "~/utils/nuxt/utils";
import { initViewer } from "~/utils/nuxt/viewer";

const { originList, item, menuItems, htmlContent, markdownRef } = await useContentPage<ArticleItem>(() => {
  const hash = useRoute().hash;
  if (hash) {
    window.scrollTo({
      top: document
        .getElementById(hash.slice(1))
        ?.getBoundingClientRect().y
    });
  }
});
const relativeArticles = originList.filter(i => i.id !== item.id)
  .map<{ count: number; item: ArticleItem }>(i => ({ item: i, count: i.tags.filter(t => item.tags.includes(t)).length }))
  .filter(i => i && i.count > 0)
  .sort((a, b) => b.count - a.count)
  .slice(0, 5);

useCommonSEOTitle(computed(() => item.title), computed(() => item.tags));
const activeAnchor = ref<string>();

const onScroll = () => {
  try {
    const links = Array.from(markdownRef.value!.querySelectorAll<HTMLLinkElement>("h1>a, h2>a, h3>a, h4>a, h5>a, h6>a")).reverse();
    for (const link of links) {
      if (link.getBoundingClientRect().y <= 52) {
        const hash = link.getAttribute("href");
        activeAnchor.value = menuItems.value.find(anchor => anchor.url === hash?.slice(1))?.url;
        return;
      }
    }
    // 未找到
    activeAnchor.value = menuItems.value[0]?.url;
  } catch { /* empty */ }
};

onMounted(() => {
  nextTick(() => {
    if (!useRoute().hash) {
      onScroll();
    }
    addScrollListener(onScroll);
  });
});

onBeforeUnmount(() => {
  rmScrollListener(onScroll);
});

const root = ref<HTMLElement>();
initViewer(root);
</script>

<template>
  <div
    ref="root"
    class="container mx-auto px-4 py-8 max-md:px-1 max-md:py-2"
  >
    <div class="flex w-full flex-col justify-center gap-6 lg:flex-row">
      <aside
        v-if="menuItems.length > 2"
        class="order-2 shrink-0 max-xl:hidden lg:order-1 lg:w-52"
      >
        <div class="sticky top-20 max-h-[calc(100vh-120px)] overflow-y-auto rounded-lg bg-white p-4 shadow dark:bg-dark-800">
          <h3 class="mb-4 ml-2 text-base font-medium text-dark-800 dark:text-dark-200">
            {{ $t('menu') }}
          </h3>
          <nav class="space-y-1 text-sm">
            <a
              v-for="(anchor, idx) in menuItems"
              :key="idx"
              :href="`#${anchor.url}`"
              :class="twMerge(
                $style.menuItem,
                anchor.size === 'small' && $style.menuItemSmall,
                activeAnchor === anchor.url && $style.menuItemActive
              )"
              :title="anchor.text"
            >
              <span v-html="anchor.text" />
            </a>
          </nav>
        </div>
      </aside>

      <main class="order-1 max-w-5xl flex-1 overflow-hidden rounded-lg bg-white p-6 shadow dark:bg-dark-800 max-md:px-2 lg:order-2">
        <h1 class="mb-4 text-2xl font-medium text-dark-900 dark:text-white">
          {{ item.title }}
        </h1>

        <div class="mb-6 flex flex-wrap items-center gap-4 border-b border-dark-300 pb-3 text-sm text-dark-500 dark:border-dark-600 dark:text-dark-400">
          <WroteDate :item="item" />
          <Visitors :visitors="item._visitors" />
          <div class="flex flex-wrap gap-2">
            <the-tag
              v-for="tag in item.tags"
              :key="tag"
              :href="'/articles?tag=' + tag"
            >
              {{ tag }}
            </the-tag>
          </div>
        </div>

        <article
          ref="markdownRef"
          :class="twMerge('--markdown', 'mb-8 pb-8 border-b border-dark-200 dark:border-dark-700 max-w-full')"
          v-html="htmlContent"
        />

        <aside
          v-if="relativeArticles.length"
          class="mt-8"
        >
          <div class="rounded-lg border border-dark-300 p-4 dark:border-dark-600">
            <h3 class="mb-4 text-lg font-medium text-dark-700 dark:text-dark-300">
              {{ $t('relativeArticles') }}
            </h3>
            <div class="max-h-40 space-y-4 overflow-auto">
              <NuxtLink
                v-for="{ item: i } in relativeArticles"
                :key="i.id"
                :to="`/articles/${i.customSlug || i.id}`"
                class="block rounded-md bg-dark-50 p-3 transition hover:bg-dark-100 dark:bg-dark-700 dark:hover:bg-dark-600"
              >
                <h4 class="text-sm font-medium text-dark-700 dark:text-dark-300">{{ i.title }}</h4>
              </NuxtLink>
            </div>
          </div>
        </aside>

        <Comments
          v-if="item.showComments"
          class="mt-8"
        />
      </main>
    </div>
  </div>
</template>

<style module>
.menuItem {
  @apply block py-2 px-3 text-sm text-dark-700 dark:text-dark-300 hover:bg-dark-100 dark:hover:bg-dark-700 hover:text-primary-600 dark:hover:text-primary-400 rounded-md font-medium;
}

.menuItemActive {
  @apply text-primary-600 dark:text-primary-400;
}

.menuItemSmall {
  @apply py-1.5 px-3 pl-6 text-xs;
}
</style>
