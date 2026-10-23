import { isDev } from "#layers/nuxt3-blog/app/utils/nuxt/constants";
import { allHotEvent } from "#layers/nuxt3-blog/vite-plugins/types";

// HACK need `import.meta.hot.off()`
export default defineNuxtPlugin(() => {
  if (isDev) {
    for (const e of allHotEvent) {
      import.meta.hot!.on(e, (data) => {
        window.dispatchEvent(new CustomEvent(e, {
          detail: data
        }));
      });
    }
  }
});
