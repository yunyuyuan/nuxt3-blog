import { encode } from "js-base64";
import { formatTime } from "../format-time";
import { translate } from "../i18n";
import { notify } from "../notify";
import { getCurrentTab } from "../utils";
import { AuthorQuery, buildCommitInput, CreateCommitMutation, type AuthorQueryData, type CreateCommitData } from "./github-queries";
import { createNotCommittableModal, createDiffModal } from ".";
import config from "~~/config";
import type { CommitParams, CommonItem, CommitParamsAddition } from "~/utils/common/types";

type GraphQLResponse<T> = { data?: T; errors?: { type?: string; message: string }[] };

async function post<T = unknown>(query: string, variables?: Record<string, unknown>, token_?: string): Promise<GraphQLResponse<T>> {
  const token = token_ || useGithubToken().value;
  if (!token) {
    throw new Error(translate("need-token"));
  }
  // 只在浏览器中运行；e2e 用 page.route 拦截这个地址
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Authorization": "Bearer " + token,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });
  if (!res.ok) {
    // 401（token 无效）等错误：GitHub 返回 { message }
    const body = await res.json().catch(() => ({})) as { message?: string };
    throw new Error(`GitHub API ${res.status}: ${body.message || res.statusText}`);
  }
  return await res.json() as GraphQLResponse<T>;
}

/** @description 是否管理员 */
export async function isAuthor(token: string): Promise<boolean> {
  const result = await post<AuthorQueryData>(AuthorQuery, {
    owner: config.githubName,
    name: __NB_GITHUB_REPO__,
    branch: __NB_GIT_BRANCH__
  }, token);
  if (result.errors?.length) {
    throw new Error(result.errors.map(e => e.message).join("; "));
  }
  // GitHub 用户名不区分大小写
  const verified = result.data?.viewer?.login?.toLowerCase() === config.githubName.toLowerCase();
  if (verified) {
    // token 验证成功
    useGithubToken().value = token;
    // 更新 commit id
    useRemoteLatestSha().value = result.data?.repository?.ref?.target?.history?.nodes?.[0]?.oid ?? "";
  }
  return verified;
}

/**
 *
 * @param commit commit信息
 * @param additions 修改/增加内容
 * @param deletions 删除内容
 * @returns 是否执行成功，失败会自动notify
 */
export async function createCommit(
  commit = "",
  { additions, deletions }: CommitParams
): Promise<boolean> {
  const correctSha = useRemoteLatestSha().value;
  if (__NB_BUILDTIME_VITESTING__) {
    await post(JSON.stringify({ additions, deletions }));
    return true;
  }
  if (correctSha !== __NB_CURRENT_GIT_SHA__ && !(await createNotCommittableModal())) {
    return false;
  }
  // 显示 diff 弹窗让用户确认更改
  if (!(await createDiffModal({ additions, deletions }))) {
    return false;
  }
  try {
    const result = await post<CreateCommitData>(CreateCommitMutation, {
      input: buildCommitInput({
        owner: config.githubName,
        repo: __NB_GITHUB_REPO__,
        branch: __NB_GIT_BRANCH__,
        headline: `[${formatTime()}]${commit}`,
        expectedHeadOid: correctSha,
        additions,
        deletions
      }, encode)
    });
    const err = result.errors;
    if (err?.length) {
      notify({
        title: err[0]!.type || "Error",
        type: "error",
        description: err[0]!.message
      });
      return false;
    }
    notify({
      title: translate("update-success"),
      description: translate("refresh-after-sec", [1])
    });
    // 更新成功必刷新页面，防止后续操作commit id不正确。若存在草稿，此操作依旧会被beforeUnload拦截
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    return true;
  } catch (e: any) {
    notify({
      title: "Error!",
      type: "error",
      description: e.toString()
    });
    throw e;
  }
}

/**
 * 把删除封装成函数，因为即有多项删除，也有单项删除
 * @param newList 新json，不需要cloneDeep
 * @param dels 删除的CommonItem[]
 * @returns 是否执行成功
 */
export function deleteList(
  newList: CommonItem[],
  dels: { item: CommonItem; md: string }[]
): Promise<boolean> {
  const commitInfo
    = dels.length === 1 ? `'${dels[0]!.item.id}'` : `${dels.length} items`;
  const folder = getCurrentTab();
  return createCommit(
    `Delete ${commitInfo} from ${folder}`,
    {
      additions: [
        {
          path: `public/rebuild/json${folder}.json`,
          content: JSON.stringify(newList)
        }
      ],
      deletions: dels.map(item => ({
        path: `public/rebuild${folder}/${item.item.id}.md`,
        content: item.md
      }))
    }
  );
}

/**
 * 批量提交暂存的项目
 * @param stagedItems 暂存的项目列表
 * @returns 是否执行成功
 */
export async function commitStagedItems(
  additions: CommitParamsAddition[]
): Promise<boolean> {
  if (additions.length === 0) {
    return true;
  }

  const commitMessage = `Batch update ${additions.length} items`;
  return createCommit(commitMessage, { additions });
}
