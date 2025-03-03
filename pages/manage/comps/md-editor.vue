<script setup lang="ts">
import throttle from "lodash/throttle.js";
import debounce from "lodash/debounce.js";
import type { editor as MonacoEditor } from "monaco-editor";
import StickerPick from "./sticker-pick.vue";
import { initViewer } from "~/utils/nuxt/viewer";
import { useMarkdownParser } from "~/utils/hooks/useMarkdownParser";
import { useUnmount } from "~/utils/hooks/useUnmount";

const props = defineProps({
  modelValue: { type: String, default: "" },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  single: { type: Boolean, default: false }
});

const emit = defineEmits(["update:modelValue", "preview"]);

let editor: MonacoEditor.IStandaloneCodeEditor;

const currentView = ref<"edit" | "preview" | "both">("both");
const currentText = ref("");

const destroyFns = useUnmount();

const { htmlContent, markdownRef, menuItems } = await useMarkdownParser({ mdValueRef: currentText, fromEdit: true, destroyFns });

// sticker
const showStickers = ref(false);
const insertSticker = (text: string) => {
  if (editor) {
    editor.trigger("keyboard", "type", { text });
  }
};

const showPreviewContents = ref(false);

// resize
const root = ref<HTMLElement>();
const leftSideWidth = ref(0);
const lisetenResize = throttle((e: MouseEvent | TouchEvent) => {
  const x = e instanceof MouseEvent ? e.x : e.touches[0].clientX;
  const width = x - root.value!.getBoundingClientRect().x;
  leftSideWidth.value = width > 0 ? width : 1;
}, 50);

const startResize = () => {
  window.addEventListener("mousemove", lisetenResize);
  window.addEventListener("touchmove", lisetenResize);
  window.addEventListener("mouseup", stopResize);
  window.addEventListener("touchend", stopResize);
  document.body.classList.add("resizing");
};
const stopResize = () => {
  window.removeEventListener("mouseup", stopResize);
  window.removeEventListener("touchend", stopResize);
  window.removeEventListener("mousemove", lisetenResize);
  window.removeEventListener("touchmove", lisetenResize);
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
    editor = module.editor.create(editorContainer.value!, {
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
        const text = editor.getModel()!.getValue();
        emit("update:modelValue", text);
        currentText.value = text;
      }, 500)
    );
  });
};

watch(() => props.modelValue, (text) => {
  if (editor && text !== editor.getModel()!.getValue()) {
    editor.getModel()!.setValue(text);
  }
});
watch(() => props.loading, initEditor);
watch(() => props.disabled, (readOnly) => {
  editor?.updateOptions({ readOnly });
});

onMounted(initEditor);
onBeforeUnmount(() => {
  editor?.dispose();
});
initViewer(markdownRef);
</script>

<template>
  <div
    ref="root"
    :class="['manage-md-editor', 'flexc', currentView]"
  >
    <div
      v-if="props.loading"
      class="md-loading flex"
    >
      <svg-icon name="loading" />
    </div>
    <div class="editor-head flex">
      <a
        class="add-sticker"
        :title="$t('add-sticker')"
        @click="showStickers = true"
      >
        <img src="/sticker/yellow-face/18.png">
        <common-dropdown v-model:show="showStickers">
          <StickerPick
            v-model="showStickers"
            class="s100"
            @insert-sticker="insertSticker"
          />
        </common-dropdown>
      </a>
      <nuxt-link
        v-if="!single"
        :title="$t('markdown-ref')"
        :to="'/manage/md-ref'"
        target="_blank"
      >
        <svg-icon name="markdown" />
      </nuxt-link>
      <a
        class="preview-contents"
        :title="$t('contents')"
        @click="menuItems.length && (showPreviewContents = true)"
      >
        <svg-icon name="preview-contents" />
        <common-dropdown v-model:show="showPreviewContents">
          <div class="s100 flex">
            <ol>
              <li
                v-for="(anchor, idx) in menuItems"
                :key="idx"
              >
                <a
                  :class="[anchor.size, 'flex']"
                  :title="anchor.text"
                >
                  <span v-html="anchor.text" />
                </a>
              </li>
            </ol>
          </div>
        </common-dropdown>
      </a>
      <a
        v-if="!single"
        class="preview"
        :title="$t('preview')"
        @click="emit('preview')"
      ><svg-icon name="preview" /></a>
      <a
        class="split"
        :title="$t('toggle-view-mode')"
        @click="
          currentView
            = currentView == 'both'
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
      <div
        ref="resizeRef"
        class="resizer"
        @touchstart="startResize"
        @mousedown.left="startResize"
      />
      <div
        class="righr-side"
        data-testid="rendered-markdown"
      >
        <article
          ref="markdownRef"
          class="--markdown"
          v-html="htmlContent"
        />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.manage-md-editor {
  background: white;

  @include dark-mode {
    background: rgb(39 39 39);
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

  >div {
    width: 100%;
  }

  .editor-head {
    background: #fefffe;

    @include dark-mode {
      background: rgb(39 39 39);
    }

    box-sizing: border-box;
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

      &.add-sticker {
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
                      border-color: rgb(117 117 117);
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

      &.preview-contents {
        margin-left: auto;

        .common-dropdown {
          right: 10px;
          overflow: auto;
          max-width: 300px;
          max-height: 90vh;
          cursor: initial;

          ol {
            box-sizing: border-box;
            list-style: none;
            width: 100%;
            padding: 12px;
            font-size: 16px;

            li:not(:last-of-type) {
              margin-bottom: 8px;
            }

            a {
              &.small {
                padding-left: 12px;
                font-size: 0.9em;
              }

              span {
                @include textoverflow(1);

                white-space: nowrap;
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
    padding: 0 8px;
    min-width: 100px;
  }
}

@include mobile {
  .manage-md-editor {
    min-width: unset;
    width: 100%;
  }
}
</style>
