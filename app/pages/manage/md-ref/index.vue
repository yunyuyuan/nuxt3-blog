<script setup lang="ts">
import MdEditor from "~/pages/manage/comps/md-editor.vue";
import mdSample from "~/assets/style/markdown.md?raw";
import config from "~~/config";
import { useCommonSEOTitle } from "~/utils/nuxt/utils";
import { translate } from "~/utils/nuxt/i18n";

const inputMarkdown = ref(mdSample);

useCommonSEOTitle(computed(() => translate("markdown-ref") + config.SEO_title));
</script>

<template>
  <client-only>
    <md-editor
      v-model="inputMarkdown"
      :single="true"
    />
  </client-only>
</template>
