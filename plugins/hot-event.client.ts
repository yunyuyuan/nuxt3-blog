import { isDev } from "~/utils/constants";
import { allHotEvent } from "~/dev-server/types";

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
