import fs from "fs";
import path from "path";
import { Plugin } from "vite";

type FileItem = {
  path: string,
  content?: string,
}

export type UpdateRebuild = {
  additions: FileItem[],
  deletions: FileItem[],
}

function writeFile (file: FileItem): void {
  fs.writeFileSync(path.resolve(__dirname, file.path), file.content);
}

function removeFile (file: FileItem): void {
  fs.unlinkSync(path.resolve(__dirname, file.path));
}

const LOCAL_SERVER = "ls:";

export default {
  name: "local-server-plugin",
  resolveId (source, importer, options) {
    if (source.startsWith(LOCAL_SERVER)) {
      const realPath = source.slice(LOCAL_SERVER.length);
      const id = process.env.NODE_ENV === "development" ? realPath.replace(/([^/]*)$/, "__$1") : realPath;
      return this.resolve(id, importer, options).then(resolved => resolved || { id });
    }
    return null;
  },
  configureServer (server) {
    server.ws.on("rebuild:update", (data: UpdateRebuild, client) => {
      try {
        data.additions.forEach(writeFile);
        data.deletions.forEach(removeFile);
        client.send("rebuild:result", true);
      } catch (e) {
        client.send("rebuild:result", e.toString());
      }
    });
  }
} as Plugin;
