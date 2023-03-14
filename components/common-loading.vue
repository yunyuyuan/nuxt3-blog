<script setup lang="ts">
defineProps({
  showInFirst: {
    type: Boolean,
    default: true
  }
});

const isFirstLoad = useFirstLoad();
</script>

<template>
  <div :class="{hide: !showInFirst && isFirstLoad}" class="common-loading flexc">
    <svg-icon name="loading" />
    <span>{{ $T('loading') }}...</span>
  </div>
</template>

<style lang="scss">
.common-loading {
  &.hide {
    display: none;
  }

  > svg {
    @include square(60px);

    fill: $theme-color-darken;
  }

  > span {
    font-size: f-size(0.7);
    margin-top: 10px;
  }
}
</style>
