<script setup lang="ts">
const props = defineProps({
  hided: Boolean,
  show: Boolean,
  onlyMobile: Boolean,
  parent: { type: Object, default: null },
  wrapClass: { type: String, default: "" }
});

const isMobile = useIsMobile();

const emit = defineEmits(["update:hided", "update:show", "open"]);

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
  <template v-if="onlyMobile && !isMobile">
    <slot />
  </template>
  <transition
    v-else
    name="slide"
    @before-enter="emit('update:hided', false)"
    @after-enter="afterOpen"
    @after-leave="emit('update:hided', true)"
  >
    <div
      v-show="show"
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
    border-color: rgb(186 186 186);
    box-shadow: 0 0 16px rgb(0 0 0 / 30%);
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
