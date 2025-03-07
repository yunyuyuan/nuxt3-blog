<script setup lang="ts">
import { Loader2 } from "lucide-vue-next";
import type { FunctionalComponent } from "vue";

withDefaults(defineProps<{
  icon?: FunctionalComponent;
  loading?: boolean;
  disabled?: boolean;
  theme?: "default" | "primary" | "danger";
  size?: "medium" | "small";
}>(), {
  icon: undefined,
  theme: "default",
  size: "medium"
});

const emit = defineEmits(["click"]);
</script>

<template>
  <button
    :class="twMerge(
      'inline-flex items-center cursor-pointer text-sm gap-1 px-4 py-1.5 bg-dark-100 text-dark-800 rounded-md hover:bg-dark-200 transition border border-transparent',
      theme === 'primary' && 'bg-primary-600 text-white hover:bg-primary-700',
      theme === 'danger' && 'bg-red-600 text-white hover:bg-red-700',
      size === 'small' && 'px-2 py-1.5 gap-0.5 text-xs',
      theme === 'default' && 'border-dark-500/30',
      disabled && 'bg-dark-300 text-dark-600 hover:bg-dark-300 hover:text-dark-600 cursor-not-allowed'
    )"
    :disabled="disabled"
    @click="loading ? null : emit('click', $event)"
  >
    <Loader2
      v-if="loading"
      :class="twMerge('animate-spin', size === 'small' ? 'size-4' : 'size-5')"
    />
    <component
      :is="icon"
      v-else-if="Boolean(icon)"
      :class="twMerge(size === 'small' ? 'size-4' : 'size-5')"
    />
    <slot />
  </button>
</template>
