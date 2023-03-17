<script setup lang="ts">
import MdEditor from "../comps/md-editor.vue";
import mdSample from "~/assets/style/markdown.md?raw";
import config from "~/config";

const inputMarkdown = ref(mdSample);

useHead({
  title: translate("detail-manage", ["markdown"]) + config.SEO_title
});
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
}
</style>
