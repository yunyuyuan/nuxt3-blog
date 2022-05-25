<script setup lang="ts">
defineProps<{
  stickerHided: boolean;
  show: boolean;
}>();

const stickersTranslate = {
  aru: "阿鲁",
  "yellow-face": "小黄脸"
};
const stickersList = toRaw(useRuntimeConfig().public.stickers);

const stickerRef = ref<HTMLElement>();
// 防止动画重复
const stickersTab = Object.keys(stickersList);
const currentStickerTab = ref<string>(stickersTab[0]);
const translateY = computed<string>(() => {
  return `translateY(-${
    (stickersTab.indexOf(currentStickerTab.value) * 100) / stickersTab.length
  }%)`;
});
const setStickerFocus = () => {
  stickerRef.value.focus();
};

const emit = defineEmits(["insertSticker", "hide", "slide"]);
const insertSticker = (k: string, v: number) => {
  emit("insertSticker", `![sticker](${k}/${v})`);
};
</script>

<template>
  <transition
    name="slide"
    @before-enter="emit('slide', false)"
    @after-enter="setStickerFocus"
    @after-leave="emit('slide', true)"
  >
    <div
      v-show="show"
      ref="stickerRef"
      tabindex="1"
      class="md-editor-stickers"
      @focusout="emit('hide')"
    >
      <div class="s100 flex">
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
              transform: translateY,
            }"
          >
            <div v-for="k in stickersTab" :key="k">
              <div>
                <span
                  v-for="idx in stickersList[k]"
                  :key="idx"
                  :title="`${k}/${idx}`"
                  @click="insertSticker(k, idx)"
                >
                  <img :src="`/sticker/${k}/${idx}.png`">
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </transition>
</template>

<style lang="scss">
@import "assets/style/var";

.md-editor-stickers {
  background: white;
  box-shadow: 0 0 16px rgb(0 0 0 / 30%);
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: $common-transition;
  position: absolute;
  top: 100%;
  left: 10px;
  overflow: hidden;
  z-index: 2;
  width: 400px;

  $height: 200px;

  height: $height;
  transform: translateY(10px);
  outline: none;

  &.slide-enter-from {
    height: 0;
  }

  &.slide-enter-to {
    height: $height;
  }

  &.slide-leave-active {
    height: 0;
  }

  > div {
    .stickers-title {
      height: 100%;

      span {
        font-size: 13px;
        padding: 0 5px;
        word-break: break-all;
        height: 50%;
        display: flex;
        align-items: center;
        cursor: pointer;
        transition: $common-transition;

        &:hover {
          background: rgb(230 230 230);
        }

        &.active {
          background: rgb(108 108 108);
          color: white;
        }
      }
    }

    .stickers-container {
      height: 100%;
      overflow: hidden;

      > .inner {
        transition: $common-transition;
        transform: translateY(0);

        > div {
          height: $height;
          overflow-y: auto;

          > div {
            display: flex;
            flex-wrap: wrap;
            border: 1px solid #ddd;
            border-right: none;
            border-bottom: none;

            span {
              display: flex;
              align-items: center;
              justify-content: center;

              @include square(42px);

              transition: $common-transition;
              border: 1px solid #ddd;
              border-left: none;
              border-top: none;

              &:hover {
                background: rgb(228 228 228);

                img {
                  transform: scale(1.1);
                }
              }

              img {
                @include square(80%);

                object-fit: contain;
                transition: $common-transition;
              }
            }
          }
        }
      }
    }
  }
}
</style>
