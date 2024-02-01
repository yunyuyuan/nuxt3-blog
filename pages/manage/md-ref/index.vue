<script setup lang="ts">
import MdEditor from "~/pages/manage/comps/md-editor.vue";
import mdSample from "~/assets/style/markdown.md?raw";
import config from "~/config";
import { translate, useCommonSEOTitle } from "~/utils/nuxt";

const inputMarkdown = ref(mdSample);

useCommonSEOTitle(computed(() => translate("markdown-ref") + config.SEO_title));
</script>

<template>
  <client-only>
    <md-editor v-model="inputMarkdown" :single="true" />
  </client-only>
</template>

<style lang="scss">
.manage-md-editor {
  height: 99vh;
  padding-bottom: 0 !important;
  box-shadow: 0 0 10px rgb(214 214 214);
}
</style>
