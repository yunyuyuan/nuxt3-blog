import axios from "axios";
import { isPrerender } from "~/utils/nuxt/constants";
import { withBase } from "~/utils/nuxt/with-base";

export function DBOperate<T = any> (
  { apiPath, query, callback }:
  { apiPath: string, query: any, callback: (_: T) => any}
) {
  if (import.meta.client && !isPrerender && __NB_DATABASE_ENABLED__) {
    const cb = (data: T) => {
      try {
        callback(data);
      } catch { }
    };

    axios.post(withBase(`/api${apiPath}`), query).then(res => cb(res.data));
  }
}
