import { isDev } from "~/utils/nuxt";
import { allHotEvent } from "~/vite-plugins/types";

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
