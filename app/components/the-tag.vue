<script setup lang="ts">
withDefaults(defineProps<{
  href?: string;
  num?: number;
  active?: boolean;
}>(), {
  href: "",
  num: -1
});

const emit = defineEmits(["click"]);
</script>

<template>
  <span
    v-if="!href"
    :class="twMerge($style.tag, active && $style.active)"
    @click="emit('click', $event)"
  >
    <slot />
    <span
      v-if="num >= 0"
      :class="$style.num"
    >{{ num }}</span>
  </span>
  <NuxtLink
    v-else
    :class="twMerge($style.tag, active && $style.active)"
    :to="href"
  >
    <slot />
    <span
      v-if="num >= 0"
      :class="$style.num"
    >{{ num }}</span>
  </NuxtLink>
</template>

<style module>
.tag {
  @apply rounded-full border border-dark-100/80 bg-white/90 px-3 py-1 text-[13px] font-medium text-dark-700 hover:border-primary-400 hover:text-primary-600 dark:border-dark-700 dark:bg-dark-900/80 dark:text-dark-100;
  @apply flex items-center transition cursor-pointer;
}

.active, .tag:hover {
  @apply border-primary-400 text-primary-600 dark:border-primary-500 dark:text-primary-400;
}

.num {
  @apply ml-1.5 bg-dark-100/50 dark:bg-dark-800 text-dark-700 dark:text-dark-300 rounded-full px-2 py-0.5 text-xs;
}
</style>
