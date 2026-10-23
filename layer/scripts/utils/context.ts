import path from "path";
import { createJiti } from "jiti";
import type { BlogConfig } from "../../app/utils/common/blog-config";

/** 构建期脚本的运行环境 */
export interface BlogContext {
  /** 站点项目的根目录：config.ts 和 public/rebuild 所在的目录 */
  rootDir: string;
  config: BlogConfig;
}

let current: BlogContext | undefined;

/** 由 Nuxt 模块（构建时）或命令行入口（本地脚本）设置 */
export function setBlogContext(ctx: BlogContext) {
  current = ctx;
}

export function getBlogContext(): BlogContext {
  if (!current) {
    throw new Error("[nuxt-blog] blog context is not set, call setBlogContext() first");
  }
  return current;
}

/** 读取站点根目录下的 config.ts。不使用模块缓存，开发服务器重启后能读到新值 */
export async function loadBlogConfig(rootDir: string): Promise<BlogConfig> {
  const jiti = createJiti(__filename, { moduleCache: false });
  return await jiti.import<BlogConfig>(path.join(rootDir, "config.ts"), { default: true });
}
