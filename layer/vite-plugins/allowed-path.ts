import path from "path";

/**
 * 开发模式下，后台可以通过 nb-rebuild-plugin 写入或删除的文件：
 * public/rebuild/ 内的文件（条目 JSON 和 md），以及根目录的 config.ts（配置页）。
 * 返回绝对路径；其他路径（包括 ../ 跳出仓库的路径）抛错。
 */
export function resolveWritablePath(rootDir: string, relativePath: string): string {
  const target = path.resolve(rootDir, relativePath);
  const rebuildDir = path.resolve(rootDir, "public/rebuild") + path.sep;
  if (target === path.resolve(rootDir, "config.ts") || target.startsWith(rebuildDir)) {
    return target;
  }
  throw new Error(`Refusing to write outside public/rebuild/ and config.ts: ${relativePath}`);
}
