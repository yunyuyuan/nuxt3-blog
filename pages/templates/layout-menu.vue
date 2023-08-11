<script setup lang="ts">
import { HeaderTabs } from "~/utils/common";

const activeRoute = computed(() => {
  return useRoute().path.split("/")[1] || HeaderTabs[0].url.substring(1);
});
const isMobile = useIsMobile();
</script>

<template>
  <div class="layout-menu flex" :class="{'in-mobile': isMobile}">
    <nuxt-link
      v-for="item in HeaderTabs"
      :key="item.url"
      :class="{ item: true, active: activeRoute === item.url.substring(1) }"
      :to="item.url"
    >
      {{ $T(item.name) }}
      <span />
      <span />
      <span />
      <span />
    </nuxt-link>
  </div>
</template>
