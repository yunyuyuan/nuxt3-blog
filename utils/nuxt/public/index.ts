import axios from "axios";
import { isPrerender, inBrowser } from "~/utils/nuxt";

export function DBOperate<T = any> (
  { apiPath, query, callback }:
  { apiPath: string, query: any, callback: (_: T) => any}
) {
  if (inBrowser && !isPrerender && useRuntimeConfig().app.mongoDBEnabled) {
    const cb = (data: T) => {
      try {
        callback(data);
      } catch { }
    };

    axios.post(`/api${apiPath}`, query).then(res => cb(res.data));
  }
}

export * from "./list";
export * from "./detail";
