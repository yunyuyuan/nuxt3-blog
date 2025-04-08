<script setup lang="ts">
import { createCommit } from "ls:~/utils/nuxt/manage/github";
import type { editor as Editor } from "monaco-editor";
import { Upload } from "lucide-vue-next";
import configString from "~/config.ts?raw";
import config from "~/config";
import { translate } from "~/utils/nuxt/i18n";
import { useStatusText } from "~/utils/nuxt/manage";
import { useCommonSEOTitle } from "~/utils/nuxt/utils";

useCommonSEOTitle(computed(() => translate("config-manage") + config.SEO_title));

let editor: Editor.IStandaloneCodeEditor;
const editorRef = ref<HTMLElement>();
const inputText = ref<string>(configString);
const modified = computed(() => inputText.value !== configString);

const { statusText, canCommit, processing, toggleProcessing } = useStatusText(modified);

const { themeMode } = useThemeMode();
if (import.meta.client) {
  onMounted(() => {
    import("monaco-editor").then((module) => {
      editor = module.editor.create(editorRef.value!, {
        value: inputText.value,
        language: "javascript",
        theme: "vs",
        automaticLayout: true,
        minimap: {
          enabled: false
        }
      });
      watch(themeMode, (mode) => {
        editor.updateOptions({
          theme: mode === "light" ? "vs" : "vs-dark"
        });
      }, { immediate: true });
      editor.onDidChangeModelContent(() => {
        const text = editor.getModel()!.getValue();
        inputText.value = text;
      });
    });
  });
}

const doUpload = async () => {
  toggleProcessing();
  try {
    await createCommit("Update config.ts", {
      additions: [{
        path: "config.ts",
        content: inputText.value
      }]
    });
  } finally {
    toggleProcessing();
  }
};

onBeforeUnmount(() => {
  editor?.dispose();
});
</script>

<template>
  <main class="flex h-full flex-col gap-2 px-2 py-4 shadow-md md:px-4">
    <div class="flex items-center justify-end">
      <span
        v-show="!!statusText"
        class="mr-4 text-xs text-red-500"
      >{{ statusText }}</span>
      <CommonButton
        :icon="Upload"
        :disabled="!canCommit || !modified"
        :loading="processing"
        data-testid="update-config-btn"
        theme="primary"
        @click="doUpload"
      >
        {{ $t('update') }}
      </CommonButton>
    </div>
    <div class="grow border border-dark-300 dark:border-dark-600">
      <div
        ref="editorRef"
        class="h-[calc(100vh_-_120px)]"
      />
    </div>
  </main>
</template>
