<script setup lang="ts">
const props = defineProps({
  hided: Boolean,
  show: Boolean,
  focus: { type: Boolean, default: true }
});

const emit = defineEmits(["update:hided", "update:show", "open"]);

const innerRef = ref<HTMLElement>();
const setInnerFocus = () => {
  if (props.focus) {
    innerRef.value.focus();
  }
  emit("open");
};
</script>

<template>
  <transition
    name="slide"
    @before-enter="emit('update:hided', false)"
    @after-enter="setInnerFocus"
    @after-leave="emit('update:hided', true)"
  >
    <div
      v-show="show"
      ref="innerRef"
      class="common-dropdown"
      :tabindex="focus ? '1' : '-1'"
      @focusout="emit('update:show', false)"
    >
      <slot />
    </div>
  </transition>
</template>

<style lang="scss">
@import "assets/style/var";

.common-dropdown {
  background: white;
  box-shadow: 0 0 16px rgb(0 0 0 / 30%);
  border-radius: 4px;
  border: 1px solid #ddd;
  transition: $common-transition;
  position: absolute;
  top: 100%;
  z-index: $z-index-dropdown;
  transform: scaleY(1) translateY(5px);
  transform-origin: top;
  opacity: 1;
  outline: none;

  &.slide-enter-from {
    transform: scaleY(0.2) translateY(5px);
    opacity: 0;
  }

  &.slide-enter-to {
    transform: scaleY(1) translateY(5px);
    opacity: 1;
  }

  &.slide-leave-active {
    transform: scaleY(0.2) translateY(5px);
    opacity: 0;
  }
}
</style>
