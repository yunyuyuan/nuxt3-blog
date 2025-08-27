<script setup lang="ts">
const showStickers = defineModel<boolean>({ required: true });

const emits = defineEmits({
  insertSticker: (_: string) => true
});

const stickersList = toRaw(useRuntimeConfig().public.stickers);
const stickersTab = Object.keys(stickersList) as (keyof typeof stickersList)[];
const currentStickerTab = ref(stickersTab[0]!);
const stickerTranslateY = computed(() => {
  return `translateY(-${
    (stickersTab.indexOf(currentStickerTab.value) * 100) / stickersTab.length
  }%)`;
});
</script>

<template>
  <common-dropdown
    v-model:show="showStickers"
    :wrap-class="$style.dropdown"
  >
    <div class=" flex h-48 max-w-[500px]">
      <div class="flex h-full flex-col border-r">
        <button
          v-for="k in stickersTab"
          :key="k"
          :class="twMerge(
            'px-1 text-sm',
            currentStickerTab === k && 'bg-dark-100 dark:bg-dark-600'
          )"
          :style="{
            height: `${100/stickersTab.length}%`
          }"
          :title="k"
          @click="currentStickerTab = k"
        >
          <img
            class="min-w-6"
            :src="`/sticker/${k}/1.png`"
          >
        </button>
      </div>
      <div class="h-full overflow-hidden">
        <div
          :style="{
            height: `${stickersTab.length * 100}%`,
            transform: stickerTranslateY
          }"
        >
          <div
            v-for="k in stickersTab"
            :key="k"
            class="flex flex-wrap overflow-auto"
            :style="{
              height: `${100/stickersTab.length}%`
            }"
          >
            <button
              v-for="idx in stickersList[k]"
              :key="idx"
              :title="`${k}/${idx}`"
              class="group shrink-0 rounded p-1 transition hover:bg-dark-100 dark:hover:bg-dark-700"
              @click="emits('insertSticker', `![sticker](${k}/${idx})`);showStickers=false"
            >
              <img
                class="size-8 object-contain transition group-hover:scale-105"
                :src="`/sticker/${k}/${idx}.png`"
              >
            </button>
          </div>
        </div>
      </div>
    </div>
  </common-dropdown>
</template>

<style module>
.dropdown {
  @apply left-2;
}
</style>
