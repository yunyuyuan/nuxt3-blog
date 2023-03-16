<script setup lang="ts">
import { HeaderTabs } from "~/utils/types";

const activeRoute = computed(() => {
  const path = useRoute().path.split("/")[1];
  return path;
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
