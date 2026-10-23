import crypto from "crypto";
import config from "~~/config";

const TTL = 10 * 60 * 1000;
const MAX_ENTRIES = 100;
/** sha256(token) -> 过期时间。只缓存校验通过的结果，不保存 token 原文 */
const verified = new Map<string, number>();

export function clearGithubAuthCache() {
  verified.clear();
}

/**
 * 判断 token 的持有者是否对博客仓库（config.githubName/config.githubRepo）有 push 权限。
 * 后台本来就用这个 token 提交内容，所以它可以证明调用者是博客作者或协作者。
 */
export async function hasRepoPushAccess(token: string | undefined): Promise<boolean> {
  if (!token) {
    return false;
  }
  const key = crypto.createHash("sha256").update(token).digest("hex");
  const now = Date.now();
  if ((verified.get(key) ?? 0) > now) {
    return true;
  }
  const res = await fetch(`https://api.github.com/repos/${config.githubName}/${config.githubRepo}`, {
    headers: {
      "Accept": "application/vnd.github+json",
      "Authorization": `Bearer ${token}`,
      "User-Agent": "nuxt-blog",
      "X-GitHub-Api-Version": "2022-11-28"
    }
  });
  if (!res.ok) {
    return false;
  }
  const repo = await res.json() as { permissions?: { push?: boolean } };
  if (repo.permissions?.push !== true) {
    return false;
  }
  if (verified.size >= MAX_ENTRIES) {
    verified.clear();
  }
  verified.set(key, now + TTL);
  return true;
}
