<script setup lang="ts">
import { Loader2 } from "lucide-vue-next";
import type { editor as MonacoEditor } from "monaco-editor";
import type { CommitParamsAddition, CommitParamsDeletion } from "~/utils/common/types";
import { fetchAny } from "~/utils/nuxt/fetch";

const show = defineModel<boolean>({ required: true });

const props = defineProps<{
  additions?: CommitParamsAddition[];
  deletions?: CommitParamsDeletion[];
  rawDiff?: { path: string; original: string; modified: string }[];
  showOk?: boolean;
  onClose: () => void;
  onOk: () => void;
}>();

const editorsContainer = ref<HTMLElement>();

interface FileChange {
  path: string;
  type: "addition" | "deletion";
  originalContent: string;
  modifiedContent: string;
}
const editors: MonacoEditor.IStandaloneDiffEditor[] = [];

const fileChanges = ref<FileChange[]>([]);
const loadingChanges = ref(true);

const { themeMode } = useThemeMode();

// 获取文件的语言类型
const getLanguageFromPath = (path: string) => {
  if (path.endsWith(".md")) return "markdown";
  if (path.endsWith(".json")) return "json";
  return "plaintext";
};

// 加载所有文件变更
const loadFileChanges = async () => {
  loadingChanges.value = true;
  const changes: FileChange[] = [];

  // 处理 rawDiff
  if (props.rawDiff && props.rawDiff.length > 0) {
    for (const diff of props.rawDiff) {
      changes.push({
        path: diff.path,
        type: "addition",
        originalContent: diff.original,
        modifiedContent: diff.modified
      });
    }
  }

  // 处理 additions
  if (props.additions && props.additions.length > 0) {
    for (const addition of props.additions) {
      try {
        const originalContent = await fetchAny<string>(addition.path) || "";
        changes.push({
          path: addition.path,
          type: "addition",
          originalContent,
          modifiedContent: addition.content
        });
      } catch {
        // 文件不存在，说明是新文件
        changes.push({
          path: addition.path,
          type: "addition",
          originalContent: "",
          modifiedContent: addition.content
        });
      }
    }
  }

  // 处理 deletions
  if (props.deletions && props.deletions.length > 0) {
    for (const deletion of props.deletions) {
      try {
        const originalContent = deletion.content || "";
        changes.push({
          path: deletion.path,
          type: "deletion",
          originalContent,
          modifiedContent: ""
        });
      } catch {
        changes.push({
          path: deletion.path,
          type: "deletion",
          originalContent: "[File not found]",
          modifiedContent: ""
        });
      }
    }
  }

  fileChanges.value = changes;

  // 初始化编辑器
  if (!editorsContainer.value) {
    return;
  }

  const monaco = await import("monaco-editor");

  fileChanges.value.forEach((change, index) => {
    const editorElement = editorsContainer.value?.querySelector(`[data-editor-index="${index}"]`) as HTMLElement;
    if (!editorElement) return;

    const language = getLanguageFromPath(change.path);

    const editor = monaco.editor.createDiffEditor(editorElement, {
      theme: themeMode.value === "light" ? "vs" : "vs-dark",
      automaticLayout: true,
      readOnly: true,
      renderSideBySide: true,
      minimap: { enabled: false },
      wordWrap: "on",
      scrollBeyondLastLine: false,
      useInlineViewWhenSpaceIsLimited: false
    });

    let modifiedContent = change.modifiedContent;
    try {
      modifiedContent = JSON.parse(modifiedContent);
      modifiedContent = JSON.stringify(modifiedContent, null, 2);
    } catch { /** empty */ }
    const originalModel = monaco.editor.createModel(typeof change.originalContent === "string" ? change.originalContent : JSON.stringify(change.originalContent, null, 2), language);
    const modifiedModel = monaco.editor.createModel(modifiedContent, language);

    editor.setModel({
      original: originalModel,
      modified: modifiedModel
    });

    editors.push(editor);
  });

  loadingChanges.value = false;

  // 监听主题变化
  watch(themeMode, (mode) => {
    editors.forEach((editor) => {
      editor.updateOptions({
        // @ts-expect-error monaco type error
        theme: mode === "light" ? "vs" : "vs-dark"
      });
    });
  });
};

// 清理所有编辑器
const disposeAllEditors = () => {
  editors.forEach((editor) => {
    editor.dispose();
  });
};

onMounted(() => {
  nextTick(() => {
    loadFileChanges();
  });
});

onBeforeUnmount(() => {
  disposeAllEditors();
});
</script>

<template>
  <common-modal
    v-model="show"
    modal-width="1000px"
    :show-ok="showOk"
    @confirm="onOk"
    @cancel="onClose"
  >
    <template #title>
      {{ $t('confirm-changes') }}
    </template>
    <template #body>
      <div
        v-if="loadingChanges"
        class="flex items-center justify-center py-8"
      >
        <div class="flex items-center gap-2 text-dark-500 dark:text-dark-400">
          <Loader2 class="size-5 animate-spin" />
          {{ $t('loading-changes') }}
        </div>
      </div>

      <div
        v-show="!loadingChanges"
        ref="editorsContainer"
        class="space-y-6"
      >
        <div
          v-for="(change, index) in fileChanges"
          :key="change.path"
        >
          <div class="mb-2 flex items-center justify-between rounded bg-dark-100 px-3 py-2 dark:bg-dark-700">
            <span class="font-mono text-sm text-dark-700 dark:text-dark-300">
              {{ change.path }}
            </span>
            <span
              class="rounded px-2 py-1 text-xs font-medium"
              :class="{
                'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200': change.type === 'addition',
                'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200': change.type === 'deletion'
              }"
            >
              {{ change.type === 'addition' ? 'Modified / Added' : 'Deleted' }}
            </span>
          </div>
          <div
            :data-editor-index="index"
            class="h-[400px] w-full overflow-hidden rounded border border-dark-200 dark:border-dark-600"
          />
        </div>
      </div>
    </template>
  </common-modal>
</template>
