import type { Plugin } from "vite";

const LOCAL_SERVER = "ls:";

export default {
  name: "nb-dev-import-plugin",
  resolveId (source, importer, options) {
    if (source.startsWith(LOCAL_SERVER)) {
      const realPath = source.slice(LOCAL_SERVER.length);
      const id = process.env.NODE_ENV === "development" ? realPath.replace(/([^/]*)$/, "__$1") : realPath;
      return this.resolve(id, importer, options).then(resolved => resolved || { id });
    }
    return null;
  }
} as Plugin;
