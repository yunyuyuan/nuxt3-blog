<script setup lang="ts">
const props = withDefaults(defineProps<{
  parent?: any;
  wrapClass?: string;
}>(), {
  parent: null,
  wrapClass: ""
});

const show = defineModel<boolean>("show", { required: true });

const emit = defineEmits(["open"]);

const animating = ref(false);
watch(show, (v) => {
  if (v && animating.value) {
    show.value = false;
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
    show.value = false;
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
      :class="twMerge(
        $style.dropdown,
        wrapClass
      )"
    >
      <slot />
    </div>
  </transition>
</template>

<style module>
.dropdown {
  @apply absolute top-full z-dropdown origin-top;
  @apply rounded-lg shadow-md transition border border-solid border-dark-200 dark:border-dark-700 bg-white dark:bg-dark-800 opacity-100;

  transform: scaleY(1) translateY(5px);

  &:global(.slide-enter-from) {
    transform: scaleY(0.2) translateY(5px);
    opacity: 0;
  }

  &:global(.slide-enter-to) {
    transform: scaleY(1) translateY(5px);
    opacity: 1;
  }

  &:global(.slide-leave-active) {
    transform: scaleY(0.2) translateY(5px);
    opacity: 0;
  }
}
</style>
