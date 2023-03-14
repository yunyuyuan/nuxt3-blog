<script setup lang="ts">
import throttle from "lodash/throttle.js";
import debounce from "lodash/debounce.js";
import type { Ref } from "vue";
import { afterInsertHtml, parseMarkdown } from "~/utils/markdown";
import { markdownTips } from "~/utils/constants";
import { initViewer } from "~/utils/viewer";

const props = defineProps<{
  modelValue: string;
  disabled: boolean;
  loading: boolean;
  getHtml:(_ref: Ref) => void;
}>();

const emit = defineEmits(["update:modelValue", "preview"]);

let editor = null;

const currentView = ref<"edit" | "preview" | "both">("both");
const currentText = ref<string>("");

// sticker
const stickersTranslate = {
  aru: "阿鲁",
  "yellow-face": "小黄脸"
};
const stickersList = toRaw(useRuntimeConfig().public.stickers);
const stickersTab = Object.keys(stickersList);
const currentStickerTab = ref<string>(stickersTab[0]);
const stickerTranslateY = computed<string>(() => {
  return `translateY(-${
    (stickersTab.indexOf(currentStickerTab.value) * 100) / stickersTab.length
  }%)`;
});
const stickerHided = ref<boolean>(true); // sticker面板是否隐藏，即动画结束
const showStickers = ref<boolean>(false);
const insertSticker = (text: string) => {
  if (editor) {
    editor.trigger("keyboard", "type", { text });
  }
};

// markdown参考
const showMarkdownReference = ref<boolean>(false);

// resize
const root = ref<HTMLElement>();
const leftSideWidth = ref<number>(0);
const lisetenResize = throttle((e: MouseEvent) => {
  const width = e.x - root.value.getBoundingClientRect().x;
  leftSideWidth.value = width > 0 ? width : 1;
}, 100);

const startResize = () => {
  window.addEventListener("mousemove", lisetenResize);
  window.addEventListener("mouseup", stopResize);
  document.body.classList.add("resizing");
};
const stopResize = () => {
  window.removeEventListener("mouseup", stopResize);
  window.removeEventListener("mousemove", lisetenResize);
  document.body.classList.remove("resizing");
};

// 初始化manoco。mounted 或者 loadingChange 后执行，但只执行一次
const { themeMode } = useThemeMode();
const editorContainer = ref<HTMLElement>();
const initEditor = () => {
  if (props.loading || editor || !editorContainer.value) {
    return;
  }
  import("monaco-editor").then((module) => {
    currentText.value = props.modelValue;
    editor = module.editor.create(editorContainer.value, {
      value: props.modelValue,
      language: "markdown",
      theme: "vs",
      wordWrap: "on",
      automaticLayout: true,
      glyphMargin: false,
      folding: false,
      minimap: {
        enabled: false
      },
      readOnly: props.disabled
    });
    watch(themeMode, (mode) => {
      editor.updateOptions({
        theme: mode === "light" ? "vs" : "vs-dark"
      });
    }, { immediate: true });
    editor.onDidChangeModelContent(
      debounce(() => {
        const text = editor.getModel().getValue();
        emit("update:modelValue", text);
        currentText.value = text;
      }, 500)
    );
  });
};

watch(
  () => props.modelValue,
  (text) => {
    if (editor && text !== editor.getModel().getValue()) {
      editor.getModel().setValue(text);
    }
  }
);
watch(() => props.loading, initEditor);
watch(
  () => props.disabled,
  (readOnly) => {
    editor?.updateOptions({ readOnly });
  }
);

// md改变时，更新html
const markdownRef = ref<HTMLElement>();
const currentHtml = ref<string>("");
watch(
  currentText,
  async () => {
    currentHtml.value = await parseMarkdown(currentText.value);
    nextTick(() => {
      if (markdownRef.value) {
        afterInsertHtml(markdownRef.value, true);
      }
    });
  },
  { immediate: true }
);
// 把htmlRef元素传给parent
props.getHtml(markdownRef);

onMounted(initEditor);
onBeforeUnmount(() => {
  editor?.dispose();
});
initViewer(markdownRef);
</script>

<template>
  <div ref="root" :class="['manage-md-editor', 'flexc', currentView]">
    <div v-if="props.loading" class="md-loading flex">
      <svg-icon name="loading" />
    </div>
    <div class="editor-head flex">
      <a :title="$t('add-sticker')" @click="stickerHided && (showStickers = true)">
        <img src="/sticker/yellow-face/18.png">
        <common-dropdown
          v-model:show="showStickers"
          v-model:hided="stickerHided"
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
                  transform: stickerTranslateY,
                }"
              >
                <div v-for="k in stickersTab" :key="k">
                  <div>
                    <span
                      v-for="idx in stickersList[k]"
                      :key="idx"
                      :title="`${k}/${idx}`"
                      @click="insertSticker(`![sticker](${k}/${idx})`);showStickers=false"
                    >
                      <img :src="`/sticker/${k}/${idx}.png`">
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </common-dropdown>
      </a>
      <a :title="$t('markdown-ref')" @click="showMarkdownReference = true">
        <svg-icon name="markdown" />
      </a>
      <a class="preview" :title="$t('preview')" @click="emit('preview')"><svg-icon name="preview" /></a>
      <a
        class="split"
        :title="$t('toggle-view-mode')"
        @click="
          currentView =
            currentView == 'both'
              ? 'edit'
              : currentView == 'edit'
                ? 'preview'
                : 'both'
        "
      >
        <svg-icon name="split" />
      </a>
    </div>
    <div class="editor-body flex">
      <div
        class="left-side"
        :style="
          currentView == 'both'
            ? `width: ${leftSideWidth ? `${leftSideWidth}px` : ''}`
            : ''
        "
      >
        <div ref="editorContainer" />
      </div>
      <div ref="resizeRef" class="resizer" @mousedown.left="startResize" />
      <div class="righr-side">
        <article ref="markdownRef" class="--markdown" v-html="currentHtml" />
      </div>
    </div>
  </div>
  <common-modal v-model="showMarkdownReference" :show-ok="false" :show-cancel="false">
    <template #title>
      {{ $t('markdown-ref') }}
    </template>
    <template #body>
      <div class="markdown-tips">
        <p>
          {{ $t('base-grammar') }}:<a
            target="_blank"
            href="https://github.github.com/gfm"
          >gfm</a>
        </p>
        <ul>
          <li v-for="tip in markdownTips" :key="tip.regx">
            <b>{{ tip.regx }}</b>
            <span>{{ $t(tip.description) }}</span>
          </li>
        </ul>
      </div>
    </template>
  </common-modal>
</template>

<style lang="scss">
.manage-md-editor {
  background: white;

  @include dark-mode {
    background: rgb(73 73 73);
  }

  position: relative;
  height: 98vh;
  align-items: stretch;

  > .md-loading {
    position: absolute;
    top: 0;
    left: 0;

    @include square;

    background: rgb(0 0 0 / 30%);
    z-index: 2;
    justify-content: center;

    svg {
      @include square(60px);
    }
  }

  &.edit {
    .editor-body {
      > .left-side {
        width: 100%;
        max-width: unset;
      }

      > .righr-side,
      > .resizer {
        display: none;
      }
    }
  }

  &.preview {
    .editor-body {
      > .left-side,
      > .resizer {
        display: none;
      }

      > .righr-side {
        width: 100%;
        max-width: unset;
      }
    }
  }

  .editor-head {
    background: #fefffe;

    @include dark-mode {
      background: rgb(73 73 73);
    }

    position: relative;
    padding: 8px 10px;
    border-top-right-radius: 4px;

    > a {
      width: 42px;
      height: 36px;
      margin-right: 10px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 3px;
      transition: $common-transition;
      background: rgb(251 251 251);
      border: 1px solid transparent;

      @include dark-mode {
        background: rgb(40 40 40);

        svg {
          fill: rgb(207 207 207);
        }

        &:hover {
          background: rgb(29 29 29);
        }

        &:active {
          border-color: rgb(0 0 0);
        }
      }

      &:hover {
        background: rgb(228 228 228);
      }

      &:active {
        border-color: rgb(151 151 151);
      }

      svg,
      img {
        @include square(25px);
      }

      &.preview {
        margin-left: auto;
      }
    }

    .common-dropdown {
      left: 10px;
      overflow: hidden;
      width: 400px;
      height: 200px;
      cursor: initial;

      @include mobile {
        width: calc(100% - 20px);
      }

      .stickers-title {
        height: 100%;

        span {
          font-size: f-size(0.75);
          padding: 0 5px;
          word-break: break-all;
          height: 50%;
          display: flex;
          align-items: center;
          cursor: pointer;
          transition: $common-transition;

          @include dark-mode {
            background: rgb(99 99 99);

            &:hover {
              background: rgb(68 68 68);
            }

            &.active {
              background: rgb(26 26 26);
              color: white;
            }
          }

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
            height: 200px;
            overflow-y: auto;

            > div {
              display: flex;
              flex-wrap: wrap;
              border: 1px solid #ddd;

              @include dark-mode {
                border-color: rgb(180 180 180);
              }

              border-right: none;
              border-bottom: none;

              span {
                display: flex;
                align-items: center;
                justify-content: center;
                cursor: pointer;

                @include square(42px);

                transition: $common-transition;
                border: 1px solid #ddd;

                @include dark-mode {
                  border-color: rgb(180 180 180);
                }

                border-left: none;
                border-top: none;

                &:hover {
                  background: rgb(228 228 228);

                  @include dark-mode {
                    background: rgb(140 140 140);
                  }

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
}

.editor-body {
  border-top: 1px solid #e3e3e3;
  height: calc(100% - 54px);

  > div {
    height: 100%;
    max-width: calc(100% - 105px);
  }

  > .left-side {
    width: 50%;
    flex-shrink: 0;
    min-width: 100px;

    > div {
      @include square;
    }
  }

  > .resizer {
    width: 4px;
    background: rgb(200 200 200);
    flex-shrink: 0;
    cursor: ew-resize;

    &:hover {
      background: rgb(174 174 174);
    }

    @at-root body.resizing & {
      background: rgb(124 124 124);
    }
  }

  > .righr-side {
    overflow: auto;
    flex-grow: 1;
    min-width: 100px;
  }
}

.markdown-tips {
  p {
    font-size: f-size(0.9);
    margin-bottom: 20px;
    text-align: center;

    a {
      color: $theme-color-darken;

      @include dark-mode {
        color: $theme-color-lighten;
      }
    }
  }

  ul {
    list-style: none;
    border-top: 1px dotted rgb(212 212 212);

    li {
      border-bottom: 1px dotted rgb(212 212 212);
      padding: 16px;

      b {
        font-size: f-size(0.75);
        color: $theme-color-darken;

        @include dark-mode {
          color: $theme-color-lighten;
        }

        display: inline-block;
        width: 300px;
        white-space: pre;
      }

      span {
        font-size: f-size(0.78);
      }
    }
  }
}

@include mobile {
  .manage-md-editor {
    min-width: unset;
    width: 100%;
  }
}
</style>
