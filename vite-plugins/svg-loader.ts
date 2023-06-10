import fs from "fs";
import { dataToEsm } from "rollup-pluginutils";
import type { Plugin } from "vite";

export default {
  name: "raw-file-loader",
  transform (_: string, filepath: string) {
    if (filepath.includes("node_modules")) {
      return null;
    }
    if (filepath.endsWith(".svg")) {
      return {
        code: dataToEsm(fs.readFileSync(filepath).toString())
      };
    }
  }
} as Plugin;
