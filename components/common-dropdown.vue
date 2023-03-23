<script setup lang="ts">
const props = defineProps({
  show: Boolean,
  parent: { type: Object, default: null },
  wrapClass: { type: String, default: "" }
});

const emit = defineEmits(["update:show", "open"]);

const animating = ref(false);
watch(() => props.show, (show) => {
  if (show && animating.value) {
    emit("update:show", false);
  }
});

const innerRef = ref<HTMLElement>();
const afterOpen = () => {
  emit("open");
  const el = props.parent || innerRef.value;
  const fn = (e: MouseEvent) => {
    let curr = e.target as (HTMLElement | null);
    while (curr) {
      if (curr === el) {
        return;
      }
      curr = curr.parentElement;
    }
    emit("update:show", false);
    document.removeEventListener("mousedown", fn);
  };
  document.addEventListener("mousedown", fn);
};
</script>

<template>
  <transition
    name="slide"
    @after-enter="afterOpen()"
    @before-leave="animating = true"
    @after-leave="animating = false"
  >
    <div
      v-show="show && !animating"
      ref="innerRef"
      class="common-dropdown"
      :class="wrapClass"
    >
      <slot />
    </div>
  </transition>
</template>

<style lang="scss">
.common-dropdown {
  background: white;
  box-shadow: 0 0 16px rgb(0 0 0 / 30%);

  @include dark-mode {
    background: $background-dark;
    border-color: rgb(77 77 77);
    box-shadow: 0 0 16px rgb(85 85 85 / 20%);
  }

  border-radius: 4px;
  border: 1px solid #ddd;
  transition: $common-transition;
  position: absolute;
  top: 100%;
  z-index: $z-index-dropdown;
  transform: scaleY(1) translateY(5px);
  transform-origin: top;
  opacity: 1;

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
