<script setup lang="ts">
defineProps({
  checked: Boolean,
  disabled: Boolean
});
const emit = defineEmits(["change"]);
</script>

<template>
  <label class="common-checkbox" :class="{ disabled, checked: checked }">
    <input
      type="checkbox"
      :checked="checked"
      :disabled="disabled || undefined"
      @change="emit('change', ($event.target as HTMLInputElement).checked)"
    >
  </label>
</template>

<style lang="scss">
.common-checkbox {
  background: rgb(227 227 227);
  position: relative;

  @include square(18px);

  display: block;
  cursor: pointer;
  border: 1px solid fade-out($theme-color, 0.7);

  &:hover {
    box-shadow: 0 0 5px rgb(210 250 255 / 20%);
    background: rgb(178 178 178);
  }

  &,
  &::after {
    transition: $common-transition;
  }

  input {
    display: none;
  }

  &.checked {
    background: $theme-color;

    &::after,
    &.disabled::after {
      opacity: 1;
    }

    &.disabled {
      background: #bbb;
    }
  }

  &.disabled {
    border: 1px solid #ababab;
    background: #ababab;
    cursor: not-allowed;
    box-shadow: none !important;

    &::after {
      opacity: 0;
    }
  }

  &::after {
    content: "";
    display: block;
    opacity: 0;
    position: absolute;
    left: 7px;
    top: 3px;
    width: 3px;
    height: 8px;
    border: solid #fff;
    border-width: 0 2px 2px 0;
    transform: rotate(45deg);
  }
}
</style>
