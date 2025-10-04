<script setup lang="ts">
import throttle from "lodash/throttle.js";
import debounce from "lodash/debounce.js";
import { Columns2, Loader2, Menu, SquareAsterisk } from "lucide-vue-next";
import type { editor as MonacoEditor } from "monaco-editor";
import StickerPick from "./sticker-pick.vue";
import { initViewer } from "~/utils/nuxt/viewer";
import { useMarkdownParser } from "~/utils/hooks/useMarkdownParser";
import { useUnmount } from "~/utils/hooks/useUnmount";

const props = defineProps<{
  disabled?: boolean;
  loading?: boolean;
  single?: boolean;
}>();

const inputValue = defineModel<string>({ required: true });

let editor: MonacoEditor.IStandaloneCodeEditor;

const currentView = ref<"edit" | "preview" | "both">("both");
const currentText = ref("");

const destroyFns = useUnmount();

const { htmlContent, markdownRef, menuItems } = await useMarkdownParser({
  mdValueRef: currentText,
  fromEdit: true,
  destroyFns
});

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
  const x = e instanceof MouseEvent ? e.x : e.touches[0]?.clientX ?? 0;
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
const initEditor = async () => {
  if (props.loading || editor) {
    return;
  }
  if (!editorContainer.value) {
    return;
  }
  currentText.value = inputValue.value;
  const module = await import("monaco-editor");
  if (!editorContainer.value) {
    return;
  }
  currentText.value = inputValue.value;
  editor = module.editor.create(editorContainer.value, {
    value: inputValue.value,
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
      inputValue.value = text;
      currentText.value = text;
    }, 500)
  );
};

watch(inputValue, (text) => {
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
    class="relative flex h-[98vh] flex-col"
  >
    <div
      v-if="props.loading"
      class="absolute inset-0 flex items-center justify-center bg-dark-500/50"
    >
      <Loader2 class="size-6 animate-spin" />
    </div>
    <div class="relative flex items-center justify-between gap-6 border-b border-dark-200 px-2 pb-2 dark:border-dark-700 max-md:gap-2">
      <button
        :title="$t('add-sticker')"
        class="icon-button"
        @click="showStickers = true"
      >
        <img
          class="size-6"
          src="/sticker/yellow-face/18.png"
        >
        <StickerPick
          v-model="showStickers"
          class=""
          @insert-sticker="insertSticker"
        />
      </button>
      <NuxtLink
        v-if="!single"
        :title="$t('markdown-ref')"
        :to="'/manage/md-ref'"
        target="_blank"
        class="icon-button"
      >
        <SquareAsterisk class="size-6" />
      </NuxtLink>
      <button
        class="icon-button ml-auto"
        :title="$t('contents')"
        @click="menuItems.length && (showPreviewContents = true)"
      >
        <Menu class="size-6" />
        <common-dropdown
          v-model:show="showPreviewContents"
          :wrap-class="$style.menuDropdown"
        >
          <div class="flex max-h-[50vh] w-32 max-w-full flex-col overflow-auto p-2">
            <div
              v-for="(anchor, idx) in menuItems"
              :key="idx"
              class="text-start"
            >
              <span
                :class="twMerge(
                  'text-sm py-1',
                  anchor.size === 'small' && 'text-xs pl-2'
                )"
                :title="anchor.text"
              >
                <span v-html="anchor.text" />
              </span>
            </div>
          </div>
        </common-dropdown>
      </button>
      <button
        class="icon-button"
        :title="$t('toggle-view-mode')"
        @click="currentView = currentView == 'both' ? 'edit'
          : currentView == 'edit'
            ? 'preview'
            : 'both'
        "
      >
        <Columns2 class="size-6" />
      </button>
    </div>
    <div class="flex grow overflow-hidden border border-dark-200 dark:border-dark-700">
      <div
        :class="twMerge(
          'w-1/2 min-w-24 h-full',
          currentView === 'both' && '',
          currentView === 'edit' && 'w-full',
          currentView === 'preview' && 'hidden'
        )"
        :style="
          currentView == 'both'
            ? `width: ${leftSideWidth ? `${leftSideWidth}px` : ''}`
            : ''
        "
      >
        <div
          ref="editorContainer"
          class="h-full"
        />
      </div>
      <div
        ref="resizeRef"
        :class="twMerge(
          $style.resize,
          currentView !== 'both' && '!hidden'
        )"
        @touchstart="startResize"
        @mousedown.left="startResize"
      >
        <span
          v-for="i in 3"
          :key="i"
          class="size-1 rounded-full bg-dark-400 dark:bg-dark-900"
        />
      </div>
      <div
        :class="twMerge(
          'w-1/2 min-w-24 h-full overflow-auto p-2',
          currentView === 'both' && 'grow',
          currentView === 'edit' && 'hidden',
          currentView === 'preview' && 'w-full'
        )"
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

<style module>
.menuDropdown {
  @apply right-2;
}

.resize {
  @apply flex flex-col gap-1 items-center justify-center h-full px-[2px] shrink-0 cursor-ew-resize bg-dark-100 dark:bg-dark-700;
}

:global(body.resizing) .resize, .resize:hover {
  @apply bg-dark-200 dark:bg-dark-600;
}
</style>
