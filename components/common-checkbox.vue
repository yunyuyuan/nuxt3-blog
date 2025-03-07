<script setup lang="ts">
import { Check } from "lucide-vue-next";

defineProps<{
  checked?: boolean;
  disabled?: boolean;
  testId?: string;
}>();

const emit = defineEmits(["change"]);
</script>

<template>
  <label
    :data-testid="testId"
    :class="twMerge(
      'group flex items-center cursor-pointer justify-center size-5 rounded border border-dark-400 dark:border-dark-500 dark:hover:border-dark-400 transition-colors hover:border-primary-700',
      checked && ' bg-primary-600 border-primary-600'
    )"
  >
    <Check
      v-if="checked"
      class="size-3.5 text-white transition group-hover:scale-105"
    />
    <input
      type="checkbox"
      class="hidden"
      :checked="checked"
      :disabled="disabled || undefined"
      @change="emit('change', ($event.target as HTMLInputElement).checked)"
    >
  </label>
</template>
