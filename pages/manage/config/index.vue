<script setup lang="ts">
import { createCommit } from "ls:~/utils/manage/github";
import config from "~/config.ts?raw";
import { inBrowser } from "~/utils/constants";
import { useStatusText } from "~/utils/manage";

useHead({
  title: "配置管理"
});

let editor = null;
const editorRef = ref<HTMLElement>();
const inputText = ref<string>(config);

const { statusText, canCommit, processing, toggleProcessing } = useStatusText();

if (inBrowser) {
  onMounted(() => {
    import("monaco-editor").then((module) => {
      editor = module.editor.create(editorRef.value, {
        value: inputText.value,
        language: "javascript",
        theme: "vs",
        automaticLayout: true,
        minimap: {
          enabled: false
        }
      });
      editor.onDidChangeModelContent(() => {
        const text = editor.getModel().getValue();
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
      <span>{{ statusText }}</span>
      <common-button icon="upload" :disabled="!canCommit" :loading="processing" @click="doUpload">
        更新
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
      font-size: 13px;
      margin: 0 15px 0 auto;
      color: #b80000;
    }
  }

  .editor-container {
    background: white;
    height: calc(100% - 100px);
    box-shadow: 0 0 12px rgb(0 0 0 / 10%);
  }
}
</style>
