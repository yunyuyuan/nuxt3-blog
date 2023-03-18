import type { Plugin } from "vite";
import { getVisitors, increaseVisitors } from "../lib/api/db/visitors";
import { getVisitorsEvent, incVisitorsEvent } from "./types";

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
    server.ws.on(incVisitorsEvent, async (data, client) => {
      try {
        client.send(incVisitorsEvent, await increaseVisitors(data));
      } catch (e: any) {
        client.send(incVisitorsEvent, e.toString());
      }
    });
  }
} as Plugin;
