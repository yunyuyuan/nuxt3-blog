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

    $fetch(withBase(`/api${apiPath}`), { method: "POST", body: query })
      .then(res => cb(res as T))
      .catch(() => { /* 统计失败不影响页面 */ });
  }
}
