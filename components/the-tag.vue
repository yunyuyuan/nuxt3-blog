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
    :class="[$style.tag, { [$style.active]: active }]"
    @click="emit('click', $event)"
  >
    <slot />
    <span
      v-if="num >= 0"
      :class="$style.num"
    >{{ num }}</span>
  </span>
  <nuxt-link
    v-else
    :class="[$style.tag, { [$style.active]: active }]"
    :to="href"
  >
    <slot />
    <span
      v-if="num >= 0"
      :class="$style.num"
    >{{ num }}</span>
  </nuxt-link>
</template>

<style module>
.tag {
  @apply px-3 py-1.5 rounded-full text-sm font-medium flex items-center transition cursor-pointer;
  @apply bg-dark-100 text-dark-800 dark:bg-dark-800 dark:text-dark-200 hover:bg-dark-200 dark:hover:bg-dark-700;
}

.active {
  @apply bg-primary-200 dark:bg-primary-900 dark:text-primary-200 hover:bg-primary-300;

  .num {
    @apply bg-primary-300 dark:bg-primary-800 text-primary-800 dark:text-primary-200;
  }
}

.num {
  @apply ml-1.5 bg-dark-200 dark:bg-dark-700 text-dark-700 dark:text-dark-300 rounded-full px-2 py-0.5 text-xs;
}
</style>
