<template>
  <div class="common-loading flexc">
    <svg-icon name="loading" />
    <span>Loading...</span>
  </div>
</template>

<style lang="scss">
@import "assets/style/var";

.common-loading {
  > svg {
    @include square(60px);

    fill: $theme-color;
  }

  > span {
    font-size: 14px;
    margin-top: 10px;
  }
}
</style>
