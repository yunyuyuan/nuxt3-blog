<script setup lang="ts">
import { SvgContainerId } from "~/utils/common";
import { inBrowser } from "~/utils/nuxt";

const props = defineProps({
  name: { type: String, required: true }
});

const icon = ref<string>("");

if (inBrowser) {
  onMounted(() => {
    watch(
      () => props.name,
      (name) => {
        const id = `icon-${name}`;
        const eId = "#" + id;
        const container = document.getElementById(SvgContainerId);
        const svgIconList: Set<string> = (window as any).svgIconList || ((window as any).svgIconList = new Set());
        if (!svgIconList.has(id)) {
          svgIconList.add(id);
          import(`../assets/svg/${name}.svg`).then((res) => {
            const svgElement = new DOMParser()
              .parseFromString(res.default, "image/svg+xml")
              .querySelector("svg");
            if (svgElement) {
              for (const key of ["width", "height", "x", "y"]) {
                svgElement.removeAttribute(key);
              }
              svgElement.id = id;
              container!.appendChild(svgElement);
            }
          }).catch(() => svgIconList.delete(id));
        }
        icon.value = eId;
      },
      { immediate: true }
    );
  });
}
</script>

<template>
  <svg class="--icon-svg common-svg" aria-hidden="true">
    <use :href="icon" />
  </svg>
</template>

<style lang="scss">
svg.--icon-svg {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>
