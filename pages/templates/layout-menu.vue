<script setup lang="ts">
import { HeaderTabs } from "~/utils/common";
import { useUnlocalePath } from "~/utils/nuxt";

const localePath = useLocalePath();
const activeRoute = computed(() => {
  return useUnlocalePath()?.split("/")[1];
});
const isMobile = useIsMobile();
</script>

<template>
  <div class="layout-menu flex" :class="{'in-mobile': isMobile}">
    <nuxt-link
      v-for="item in HeaderTabs"
      :key="item.url"
      :class="{ item: true, active: activeRoute === item.url.substring(1) }"
      :to="localePath(item.url)"
    >
      {{ $T(item.name) }}
      <span />
      <span />
      <span />
      <span />
    </nuxt-link>
  </div>
</template>
