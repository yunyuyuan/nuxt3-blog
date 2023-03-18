<script setup lang="ts">
defineProps({
  href: { type: String, default: "" },
  active: Boolean
});
const emit = defineEmits(["click"]);
</script>

<template>
  <span
    v-if="!href"
    class="common-tag"
    :class="{ active }"
    @click="emit('click', $event)"
  >
    <slot />
  </span>
  <nuxt-link v-else class="common-tag" :to="href">
    <slot />
  </nuxt-link>
</template>

<style scoped lang="scss">
$size: 1.7rem;
$color: #eaeaea;
$color-dark: #1e1e1e;

.common-tag {
  user-select: none;
  background: $color;
  border-radius: 4px;
  color: #626262;
  display: inline-flex;
  align-items: center;
  height: $size;
  padding: 0 8px;
  position: relative;
  cursor: pointer;
  transition: all 0.1s linear;
  font-size: math.div($size, 2);
  line-height: math.div($size, 2);
  text-decoration: none;
  word-break: keep-all;

  @include dark-mode {
    background: $color-dark;
    color: #fff;
  }

  // &:after,
  // &:before {
  //   content: "";
  //   background: #fff;
  //   position: absolute;
  //   transition: all 0.1s linear;
  // }

  // &:before {
  //   border-radius: 10px;
  //   box-shadow: inset 0 1px rgb(0 0 0 / 25%);
  //   left: 8px;
  //   @include square(6px);
  //   top: math.div($size, 2);
  //   transform: translateY(-50%);
  // }

  // &:after {
  //   border-bottom: math.div($size, 2) solid transparent;
  //   border-left: 10px solid $color;
  //   border-top: math.div($size, 2) solid transparent;
  //   right: 0;
  //   top: 0;
  // }

  &:hover {
    background: #d7d7d7;

    @include dark-mode {
      background: #535353;
    }

    &::after {
      border-left-color: #d7d7d7;
    }
  }

  &.active {
    background: $theme-color;
    color: white;

    @include dark-mode {
      background: $theme-color-lighten;
      color: black;
    }

    &::after {
      border-left-color: $theme-color;
    }
  }
}
</style>
