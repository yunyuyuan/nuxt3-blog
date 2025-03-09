<script setup lang="ts">
import { ChevronRight } from "lucide-vue-next";
import { KnowledgeColorMap, KnowledgeIconMap, type KnowledgeItem, type KnowledgeTab, KnowledgeTabs, KnowledgeTabsList } from "~/utils/common/types";
import { useListPage } from "~/utils/nuxt/public/list";
import { formatTime } from "~/utils/nuxt/format-time";
import { useRouteQuery } from "~/utils/hooks/useRouteQuery";

const currentTab = useRouteQuery("type");

const knowledgeList = await useListPage<KnowledgeItem>();

const isAll = computed(
  () => !(KnowledgeTabs as string[]).includes(currentTab.value)
);

const tabs = computed(() => [
  { name: "all", key: "", active: isAll.value },
  ...KnowledgeTabsList.map(item => ({ ...item, active: currentTab.value === item.key }))
]);

const filteredList = computed(() => {
  return (isAll.value ? knowledgeList : knowledgeList.filter(item => item.type === currentTab.value)).filter(i => !!i._show);
});

const tabLengthMap = computed(() => {
  const map = new Map<string, number>();
  tabs.value.forEach((tab) => {
    map.set(tab.key, knowledgeList.filter(item => item._show && (!tab.key || item.type === tab.key)).length);
  });
  return map;
});
</script>

<template>
  <main class="container mx-auto grow px-4 py-8 max-md:px-2 max-md:py-4 lg:px-8">
    <div class="mx-auto max-w-5xl">
      <div class="mb-8 border-b border-dark-200 dark:border-dark-700">
        <nav
          class="flex space-x-8 overflow-auto"
          aria-label="Tabs"
        >
          <NuxtLink
            v-for="tab in tabs"
            :key="tab.key"
            :class="twMerge(
              'flex break-keep items-center py-2 px-1 border-b-2 border-transparent font-medium text-sm text-dark-500 dark:text-dark-400',
              tab.active ? 'border-primary-500 text-primary-600 dark:border-primary-400 dark:text-primary-400' : 'hover:text-dark-700 dark:hover:text-dark-300 hover:border-dark-300 dark:hover:border-dark-600'
            )"
            :to="`?type=${tab.key}`"
          >
            <component
              :is="KnowledgeIconMap[tab.key as KnowledgeTab]"
              class="mr-1 size-4"
            />
            {{ $t(tab.name) }}
            <client-only>
              <span class="ml-1">{{ tabLengthMap.get(tab.key) }}</span>
            </client-only>
          </NuxtLink>
        </nav>
      </div>

      <div
        v-if="filteredList.length"
        class="space-y-4"
      >
        <div
          v-for="item in filteredList"
          :key="item.id"
          class="group overflow-hidden rounded-lg bg-white shadow-sm transition-shadow duration-300 hover:shadow-md dark:bg-dark-800"
        >
          <nuxt-link
            class="block p-5"
            no-prefetch
            :to="'/knowledges/' + item.id"
          >
            <div class="flex items-center justify-between">
              <div class="flex items-center space-x-3 overflow-hidden">
                <div
                  :class="twMerge(
                    'flex size-10 shrink-0 items-center justify-center rounded-full',
                    KnowledgeColorMap[item.type]
                  )"
                >
                  <component
                    :is="KnowledgeIconMap[item.type]"
                    class="size-5"
                  />
                </div>
                <div>
                  <h3 class="line-clamp-1 overflow-hidden text-ellipsis break-all text-lg font-medium text-dark-900 transition group-hover:text-primary-700 dark:text-white dark:group-hover:text-primary-500">{{ item.title }}</h3>
                  <div class="mt-1 flex items-center">
                    <span
                      :class="twMerge(
                        'inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium',
                        KnowledgeColorMap[item.type]
                      )"
                    >
                      {{ $t(item.type) }}
                    </span>
                    <span class="ml-2 text-sm text-dark-500 dark:text-dark-400">{{ formatTime(item.time, "date") }}</span>
                  </div>
                </div>
              </div>
              <ChevronRight class="size-5 text-dark-400" />
            </div>
          </nuxt-link>
        </div>
      </div>

      <div
        v-else
        class="flex items-center justify-center pt-10 text-dark-600 dark:text-dark-400"
      >
        {{ $t('nothing-here') }}
      </div>
    </div>
  </main>
</template>
