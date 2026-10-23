<script setup lang="ts">
import MdEditor from "#layers/nuxt3-blog/app/pages/manage/comps/md-editor.vue";
import mdSample from "#layers/nuxt3-blog/app/assets/style/markdown.md?raw";
import { useCommonSEOTitle } from "#layers/nuxt3-blog/app/utils/nuxt/utils";
import { translate } from "#layers/nuxt3-blog/app/utils/nuxt/i18n";

const inputMarkdown = ref(mdSample);

useCommonSEOTitle(computed(() => translate("markdown-ref")));
</script>

<template>
  <client-only>
    <md-editor
      v-model="inputMarkdown"
      :single="true"
    />
  </client-only>
</template>
