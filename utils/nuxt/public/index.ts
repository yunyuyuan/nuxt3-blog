import axios from "axios";
import { isPrerender, inBrowser } from "~/utils/nuxt/constants";

export function DBOperate<T = any> (
  { apiPath, query, callback }:
  { apiPath: string, query: any, callback: (_: T) => any}
) {
  if (inBrowser && !isPrerender && __NB_DATABASE_ENABLED__) {
    const cb = (data: T) => {
      try {
        callback(data);
      } catch { }
    };

    axios.post(`/api${apiPath}`, query).then(res => cb(res.data));
  }
}
