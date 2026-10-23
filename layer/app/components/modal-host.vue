<script setup lang="ts">
import { modalEntries } from "#layers/nuxt-blog/app/utils/nuxt/modal";
</script>

<template>
  <!-- openModal() 打开的弹窗。CommonModal 自己 teleport 到弹窗容器，所以这里的位置不影响显示 -->
  <component
    :is="modal.component"
    v-for="modal in modalEntries"
    :key="modal.id"
    v-bind="modal.props"
  />
</template>
