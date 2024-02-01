<script setup lang="ts">
import { createCommit } from "ls:~/utils/nuxt/manage/github";
import type { editor as Editor } from "monaco-editor";
import configString from "~/config.ts?raw";
import config from "~/config";
import { inBrowser, useStatusText, translate, useCommonSEOTitle } from "~/utils/nuxt";

useCommonSEOTitle(computed(() => translate("config-manage") + config.SEO_title));

let editor: Editor.IStandaloneCodeEditor;
const editorRef = ref<HTMLElement>();
const inputText = ref<string>(configString);
const modified = computed(() => inputText.value !== configString);

const { statusText, canCommit, processing, toggleProcessing } = useStatusText();

const { themeMode } = useThemeMode();
if (inBrowser) {
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

const doUpload = () => {
  toggleProcessing();
  createCommit("Update config.ts", [{
    path: "config.ts",
    content: inputText.value
  }]).finally(() => {
    toggleProcessing();
  });
};

onBeforeUnmount(() => {
  editor?.dispose();
});
</script>

<template>
  <div class="manage-config w100 flexc">
    <div class="header flex">
      <span>{{ !modified ? $t('not-modified') : statusText }}</span>
      <common-button icon="upload" :disabled="!canCommit || !modified" :loading="processing" @click="doUpload">
        {{ $t('update') }}
      </common-button>
    </div>
    <div class="editor-container w100">
      <div ref="editorRef" class="content s100" />
    </div>
  </div>
</template>

<style lang="scss">
.manage-config {
  height: calc(100% - 20px);

  > .header {
    align-self: flex-end;
    margin: 20px 0;

    > span {
      font-size: f-size(0.75);
      margin: 0 15px 0 auto;
      color: #b80000;

      @include dark-mode {
        color: #ffa6a6;
      }
    }
  }

  .editor-container {
    background: white;
    height: 100%;
    box-shadow: 0 0 12px rgb(0 0 0 / 10%);
  }
}
</style>
