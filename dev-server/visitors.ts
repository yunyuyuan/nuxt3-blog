import type { Plugin } from "vite";
import { getVisitors, increaseVisitors } from "../lib/api/db/visitors";
import { getVisitorsEvent, incVisitorsEvent } from "./types";

export default {
  name: "nb-visitors-plugin",
  configureServer (server) {
    server.ws.on("get-visitors", async (data, client) => {
      try {
        const result = await getVisitors(data.type);
        client.send(getVisitorsEvent, result);
      } catch (e) {
        client.send(getVisitorsEvent, e.toString());
      }
    });
    server.ws.on("increase-visitors", async (data, client) => {
      try {
        client.send(incVisitorsEvent, await increaseVisitors(data));
      } catch (e) {
        client.send(incVisitorsEvent, e.toString());
      }
    });
  }
} as Plugin;
