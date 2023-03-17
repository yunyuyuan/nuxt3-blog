<script setup lang="ts">
import ClipboardJS from "clipboard";
import { notify } from "~/utils/notify/notify";
import { translateT } from "~/utils/i18n";

const svgs = useRuntimeConfig().public.svgs;

const copySvg = (name: string) => {
  ClipboardJS.copy(`<svg-icon name="${name}" />`);
  notify({
    title: translateT("copy-successful")
  });
};
</script>

<template>
  <div class="svgs-list flex">
    <span v-for="name in svgs" :key="name" class="svg-item flexc" @click="copySvg(name)">
      <svg-icon :name="name" />
      <span>{{ name }}</span>
    </span>
  </div>
</template>

<style lang="scss">
.svgs-list {
  flex-wrap: wrap;
  padding-top: 15px;

  .svg-item {
    cursor: pointer;
    margin: 0 12px 12px 0;
    padding: 12px 24px;
    transition: $common-transition;

    @include square(70px);

    &:hover {
      box-shadow: 0 0 10px rgb(209 209 209);

      svg {
        transform: scale(1.1);
      }

      >span {
        color: $theme-color-darken;
      }
    }

    svg {
      @include square(40px);

      transition: $common-transition;
    }

    >span {
      font-size: f-size(0.8);
      margin-top: 8px;
    }
  }
}
</style>
