import fs from "fs";
import type { Plugin } from "vite";
import type { CommitParams } from "../app/utils/common/types";
import { resolveWritablePath } from "./allowed-path";
import { rebuildEvent } from "./types";

/**
 * 开发模式的“提交”：后台通过 Vite WebSocket 发来要写入和删除的文件，这里改写本地文件。
 * 先校验全部路径，再执行写入；任何一个路径不合法时都不写。
 * rootDir 是站点项目的根目录（不是 layer 目录），由 modules/blog.ts 传入。
 */
export default (rootDir: string): Plugin => ({
  name: "nb-rebuild-plugin",
  configureServer(server) {
    server.ws.on(rebuildEvent, (data: CommitParams, client) => {
      try {
        const additions = (data.additions ?? []).map(file => ({ target: resolveWritablePath(rootDir, file.path), content: file.content ?? "" }));
        const deletions = (data.deletions ?? []).map(file => resolveWritablePath(rootDir, file.path));
        additions.forEach(({ target, content }) => fs.writeFileSync(target, content));
        deletions.forEach(target => fs.unlinkSync(target));
        client.send(rebuildEvent, true);
      } catch (e: any) {
        client.send(rebuildEvent, e.toString());
      }
    });
  }
});
