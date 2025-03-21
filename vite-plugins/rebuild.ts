import fs from "fs";
import path from "path";
import type { Plugin } from "vite";
import type { CommitParams, CommitParamsAddition, CommitParamsDeletion } from "../utils/common/types";
import { rebuildEvent } from "./types";

function writeFile(file: CommitParamsAddition): void {
  fs.writeFileSync(path.resolve(__dirname, "../", file.path), file.content!);
}

function removeFile(file: CommitParamsDeletion): void {
  fs.unlinkSync(path.resolve(__dirname, "../", file.path));
}

export default {
  name: "nb-rebuild-plugin",
  configureServer(server) {
    server.ws.on(rebuildEvent, (data: CommitParams, client) => {
      try {
        data.additions?.forEach(writeFile);
        data.deletions?.forEach(removeFile);
        client.send(rebuildEvent, true);
      } catch (e: any) {
        client.send(rebuildEvent, e.toString());
      }
    });
  }
} as Plugin;
