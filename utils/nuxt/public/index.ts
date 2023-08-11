import axios from "axios";
import { isDev, devHotListen, isPrerender } from "~/utils/nuxt";

export function DBOperate<T = any> (
  { hotEvent, apiPath, query, callback }:
  { hotEvent: string, apiPath: string, query: any, callback: (_: T) => any}
) {
  if (!isPrerender && useRuntimeConfig().app.mongoDBEnabled) {
    const cb = (data: T) => {
      try {
        callback(data);
      } catch { }
    };

    if (isDev) {
      import.meta.hot!.send(hotEvent, query);
      devHotListen<T>(hotEvent, cb);
    } else {
      axios.post(`/api${apiPath}`, query).then(res => cb(res.data));
    }
  }
}

export * from "./list";
export * from "./detail";
