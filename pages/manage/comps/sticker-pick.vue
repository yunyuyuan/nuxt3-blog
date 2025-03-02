<script setup lang="ts">
const showStickers = defineModel<boolean>({ required: true });

const emits = defineEmits({
  insertSticker: (_: string) => true,
});

const stickersTranslate = {
  aru: "阿鲁",
  "yellow-face": "小黄脸"
} as const;
const stickersList = toRaw(useRuntimeConfig().public.stickers);
const stickersTab = Object.keys(stickersList) as (keyof typeof stickersList)[];
const currentStickerTab = ref(stickersTab[0]);
const stickerTranslateY = computed(() => {
  return `translateY(-${
    (stickersTab.indexOf(currentStickerTab.value) * 100) / stickersTab.length
  }%)`;
});
</script>

<template>
  <div class="flex">
    <div class="stickers-title flexc">
      <span
        v-for="k in stickersTab"
        :key="k"
        :class="{ active: currentStickerTab === k }"
        @click="currentStickerTab = k"
      >{{ stickersTranslate[k] }}</span>
    </div>
    <div class="stickers-container">
      <div
        class="inner"
        :style="{
          height: `${stickersTab.length * 100}%`,
          transform: stickerTranslateY,
        }"
      >
        <div
          v-for="k in stickersTab"
          :key="k"
        >
          <div>
            <span
              v-for="idx in stickersList[k]"
              :key="idx"
              :title="`${k}/${idx}`"
              @click="emits('insertSticker', `![sticker](${k}/${idx})`);showStickers=false"
            >
              <img :src="`/sticker/${k}/${idx}.png`">
            </span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>