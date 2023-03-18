import axios from "axios";
import { isDev, isPrerender } from "./../constants";

/** 是否在dev下操作数据库 */
const DbOperateInDev = false;

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
      if (DbOperateInDev) {
        import.meta.hot!.send(hotEvent, query);
        devHotListen<T>(hotEvent, cb);
      }
    } else {
      axios.post(`/api${apiPath}`, query).then(res => cb(res.data));
    }
  }
}
