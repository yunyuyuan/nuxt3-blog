import type { Plugin } from "vite";
import { getVisitors, increaseVisitors } from "../lib/api/db/visitors";
import { getVisitorsEvent, incVisitorsEvent } from "./types";

/** 是否在dev下操作数据库 */
const DbOperateInDev = false;

export default {
  name: "nb-visitors-plugin",
  configureServer (server) {
    server.ws.on(getVisitorsEvent, async (data, client) => {
      try {
        const result = await getVisitors(data.type);
        client.send(getVisitorsEvent, result);
      } catch (e: any) {
        client.send(getVisitorsEvent, e.toString());
      }
    });
    if (DbOperateInDev) {
      server.ws.on(incVisitorsEvent, async (data, client) => {
        try {
          client.send(incVisitorsEvent, await increaseVisitors(data));
        } catch (e: any) {
          client.send(incVisitorsEvent, e.toString());
        }
      });
    }
  }
} as Plugin;
