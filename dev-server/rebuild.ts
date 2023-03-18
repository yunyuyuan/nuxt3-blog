import fs from "fs";
import path from "path";
import type { Plugin } from "vite";
import { rebuildEvent } from "./types";

type FileItem = {
  path: string,
  content?: string,
}

export type UpdateRebuild = {
  additions: FileItem[],
  deletions: FileItem[],
}

function writeFile (file: FileItem): void {
  fs.writeFileSync(path.resolve(__dirname, "../", file.path), file.content!);
}

function removeFile (file: FileItem): void {
  fs.unlinkSync(path.resolve(__dirname, "../", file.path));
}

export default {
  name: "nb-rebuild-plugin",
  configureServer (server) {
    server.ws.on(rebuildEvent, (data: UpdateRebuild, client) => {
      try {
        data.additions.forEach(writeFile);
        data.deletions.forEach(removeFile);
        client.send(rebuildEvent, true);
      } catch (e: any) {
        client.send(rebuildEvent, e.toString());
      }
    });
  }
} as Plugin;
