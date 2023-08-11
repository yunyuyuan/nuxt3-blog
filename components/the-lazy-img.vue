<script setup lang="ts">
import type { StyleValue, PropType, CSSProperties } from "vue";
import { ViewerAttr, addScrollListener, rmScrollListener } from "~/utils/common";
import { isPrerender, watchUntil } from "~/utils/nuxt";

const props = defineProps({
  src: { type: String, required: true },
  alt: { type: String, default: "" },
  containerSize: { type: Array, default: () => null },
  viewer: Boolean,
  noLazy: { type: Boolean, default: false },
  /** container绝对覆盖样式 */
  compStyle: { type: String, default: "" },
  /** 内部图片样式 */
  imgStyle: { type: String, default: "" },
  /** 加载错误时的大小 */
  errSize: { type: Object as PropType<{height: string, width: string}|null>, default: null },
  /** 显示“点击重试”按钮 */
  retry: { type: Boolean, default: true },
  title: { type: String, default: "" }
});

type ImgState = "outerView" | "loading" | "loaded" | "error";

/** 组件状态 */
const imgState = ref<ImgState>("outerView");
/** container元素的高度 */
const height = ref(0);
/** container元素的宽度 */
const width = ref(0);

const isImgErr = computed(() => imgState.value === "error");
const isImgLoading = computed(() => imgState.value === "loading");
const isShowImg = computed(
  () => imgState.value === "loading" || imgState.value === "loaded"
);
const isBlankSrc = computed(() => !props.src.trim());
const isEncryptedImg = computed(() => !isBlankSrc.value && !props.src.includes("."));
const containerStyle = computed<StyleValue>(() => {
  // 只要有compStyle，则无论什么情况都使用compStyle
  if (props.compStyle) {
    return props.compStyle;
  }
  // err
  if (imgState.value === "error" && props.errSize) {
    return props.errSize || "";
  }
  // 加载完成，直接删除containerStyle
  if (imgState.value === "loaded") {
    return "";
  }
  // 图片在视图外 | 图片出错 | 图片加载中，使用containerSize
  return props.containerSize
    ? {
      width: props.containerSize[0],
      height: props.containerSize[1]
    } as CSSProperties
    : "";
});

const root = ref<HTMLElement>();

function containerClick () {
  if (props.retry && imgState.value === "error") {
    imgState.value = "loading";
  }
}
function loadFinish (error: boolean) {
  if (isEncryptedImg.value) {
    return;
  }
  imgState.value = error ? "error" : "loaded";
}
let watchEncrypt: ReturnType<typeof watch> | null = null;
function refreshView () {
  if (isBlankSrc.value) {
    return;
  }
  if (isEncryptedImg.value) {
    imgState.value = "loaded";
    return;
  }
  if (imgState.value === "outerView") {
    if (!watchEncrypt) {
    // 第一次调用，此watch必须放在imgState.value !== "outerView"判断之后
    // 如果把watch放在setup顶层，则在图片加密且已有密码的情况下，watch被immediate执行，加密图片被置为loaded
    // 而后又被解密，走refreshView()，上面的判断就直接return了，执行不到下面的代码，导致无loading显示
      watchEncrypt = watchUntil(isEncryptedImg, () => {
      // 如果是加密图片，则直接置为loaded
        imgState.value = "loaded";
      }, { immediate: true }, "boolean", "normalWhenUntil");
    }
    const winHeight = window.innerHeight;
    const winWidth = window.innerWidth;
    const contractY = root.value!.getBoundingClientRect().y - winHeight;
    const contractX = root.value!.getBoundingClientRect().x - winWidth;
    if ((
      contractY < 0 &&
      contractY > -winHeight - height.value &&
      contractX < 0 &&
      contractX > -winWidth - width.value) ||
      props.noLazy
    ) {
      // outerView -> loading
      imgState.value = "loading";
      // 取消监听
      rmScrollListener(refreshView);
    }
  }
}

/** 完全初始化所有操作，在onMounted和src改变时调用 */
const init = () => {
  if (root.value) {
    height.value = root.value.scrollHeight;
    width.value = root.value.scrollWidth;
    refreshView();
    // 如果不在视窗内，则监听
    if (imgState.value === "outerView") {
      addScrollListener(refreshView);
    }
  }
};

watch(
  () => props.src,
  () => {
    if (!isEncryptedImg.value || !props.noLazy) {
      imgState.value = "outerView";
    }
    nextTick(init);
  }
);

onMounted(() => {
  // FIXME onMounted时，root的位置错误，需要等待页面正常渲染
  setTimeout(init, 100);
});
onBeforeUnmount(() => {
  rmScrollListener(refreshView);
});
// XXX Why need assign a new value to bind dynamic attribute?
const attr = ViewerAttr;
</script>

<template>
  <span
    ref="root"
    class="--lazy-img"
    :style="containerStyle"
    :class="{ loading: isImgLoading, err: isImgErr }"
    :title="title"
    @click="containerClick"
  >
    <img v-if="isPrerender && !isEncryptedImg" :src="props.src" :alt="alt">
    <span v-if="isImgErr || isImgLoading" class="svg flexc s100">
      <svg-icon :name="isImgErr ? 'img-error' : 'loading'" />
      <span v-show="retry && isImgErr" class="tips">{{ useNuxtApp().$t('click-to-retry') }}</span>
    </span>
    <img
      v-if="isShowImg"
      :style="imgStyle"
      :alt="alt"
      :[attr]="viewer || null"
      :src="isEncryptedImg ? '/favicon.png' : props.src"
      @error="loadFinish(true)"
      @load="loadFinish(false)"
      @abort="loadFinish(true)"
    >
  </span>
</template>

<style lang="scss">
.--lazy-img {
  overflow: hidden;
  position: relative;
  display: inline-flex;

  &.err {
    cursor: pointer;
  }

  .svg {
    background: rgba(#fff, 0.5);
    justify-content: center;
    position: absolute;
    top: 0;
    left: 0;

    svg {
      @include square(30px);
    }
  }

  .tips {
    font-size: f-size(0.65);
    height: f-size(0.65);
    color: #f44;
  }
}
</style>
