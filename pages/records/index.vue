<script setup lang="ts">
import { Calendar, Clock, Image } from "lucide-vue-next";
import { getNowDayjs } from "~/utils/common/dayjs";
import type { RecordItem } from "~/utils/common/types";
import { useListPage } from "~/utils/nuxt/public/list";
import { formatTime } from "~/utils/nuxt/format-time";
import { useRouteQuery } from "~/utils/hooks/useRouteQuery";

const currentYear = useRouteQuery("year", s => s ? parseInt(s) : undefined);

const recordList = await useListPage<RecordItem>();

const years = computed(() => {
  const result: {
    year: number;
    items: RecordItem[];
  }[] = [];
  recordList.forEach((item) => {
    const year = getNowDayjs(item.time).year();
    const exist = result.find(v => v.year === year);
    if (!exist) {
      result.push({
        year,
        items: [item]
      });
    } else {
      exist.items.push(item);
    }
  });
  return result.sort((a, b) => b.year - a.year);
});

const currentItems = computed(() => years.value.find(i => i.year === currentYear.value)?.items);

onMounted(() => {
  if (years.value.length && !currentYear.value) {
    currentYear.value = years.value[0].year;
  }
});
</script>

<template>
  <main class="container mx-auto grow px-4 py-8 max-md:px-4 lg:px-8">
    <div
      v-if="years.length"
      class="mx-auto max-w-7xl"
    >
      <div class="mb-10">
        <div class="flex flex-wrap items-center justify-center gap-3">
          <NuxtLink
            v-for="year in years"
            v-show="year.items.some(item => item._show)"
            :key="year.year"
            :class="twMerge($style.year, currentYear==year.year && $style.yearActive)"
            :to="`?year=${year.year}`"
          >
            {{ year.year }}
          </NuxtLink>
        </div>
      </div>

      <div class="mb-6">
        <h2 class="mb-4 flex items-center gap-2 text-lg font-medium text-dark-800 dark:text-dark-200">
          <Calendar class="size-6" />
          {{ currentYear }}
          <span class="ml-1.5 rounded-full bg-dark-200 px-2 py-0.5 text-xs text-dark-700 dark:bg-dark-600 dark:text-dark-200">{{ currentItems?.length }}</span>
        </h2>
        <div class="flex flex-wrap items-center gap-8 max-md:grid max-md:grid-cols-1">
          <div
            v-for="item in currentItems"
            v-show="item._show"
            :key="item.id"
            class="group"
            :title="formatTime(item.time)"
          >
            <nuxt-link
              class="relative block overflow-hidden rounded-lg shadow-md transition duration-500 hover:shadow-xl max-md:aspect-square md:size-52"
              no-prefetch
              :to="'/records/' + item.id"
            >
              <the-lazy-img
                alt="cover"
                :src="item.images[0]?.src ?? 'no-poster'"
                :retry="false"
                :class="$style.lazyImg"
              />
              <div class="absolute inset-x-0 bottom-0 flex items-center bg-gradient-to-t from-black/80 to-transparent px-3 pb-1.5 pt-4 text-xs">
                <div class="flex items-center text-white">
                  <Clock class="mr-1 size-4" />
                  <span>{{ formatTime(item.time, "month") }}</span>
                </div>
                <div class="ml-auto flex items-center rounded-md bg-black/70 px-1.5 py-1 text-white">
                  <Image class="mr-1 size-4" />
                  <span>{{ item.images.length }}</span>
                </div>
              </div>
            </nuxt-link>
          </div>
        </div>
      </div>
    </div>
    <div
      v-else
      class="flex items-center justify-center pt-10"
    >
      {{ $t('nothing-here') }}
    </div>
  </main>
</template>

<style module>
.year {
  @apply px-4 py-2 rounded-full bg-dark-200 text-dark-700 dark:bg-dark-700 dark:text-dark-300 font-medium hover:bg-dark-300 dark:hover:bg-dark-600 transition-all;
}

.yearActive {
  @apply !bg-primary-600 text-white font-medium hover:bg-primary-700;
}

.lazyImg {
  @apply size-full;

  img {
    @apply size-full hover:scale-110 transition duration-500 object-cover;
  }
}
</style>
