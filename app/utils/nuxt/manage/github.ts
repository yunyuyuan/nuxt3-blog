import axios from "axios";
import { encode } from "js-base64";
import { formatTime } from "../format-time";
import { translate } from "../i18n";
import { notify } from "../notify";
import { getCurrentTab } from "../utils";
import { createCommitModal, createDiffModal } from ".";
import config from "~~/config";
import type { CommitParams, CommonItem, CommitParamsAddition } from "~/utils/common/types";

async function post(data: string, token_?: string) {
  const token = token_ || useGithubToken().value;
  if (!token) {
    throw new Error(translate("need-token"));
  }
  return await axios.post(
    "https://api.github.com/graphql",
    { query: data },
    {
      headers: {
        Authorization: "token " + token
      }
    }
  );
}

function encodeB64(str: string) {
  return encode(str);
}

/** @description 是否管理员 */
export async function isAuthor(token: string): Promise<boolean> {
  const result = await post(
    `query {
    viewer {
      login
    }
    repository(name: "${__NB_GITHUB_REPO__}", owner: "${config.githubName}") {
      defaultBranchRef {
        target {
          ... on Commit {
            history(first: 1) {
              nodes {
                oid
              }
            }
          }
        }
      }
    }
  }`,
    token
  );
  const err = result.data.errors;
  if (err) {
    throw new Error(err);
  } else {
    const verified = result.data.data.viewer.login === config.githubName;
    if (verified) {
      // token 验证成功
      useGithubToken().value = token;
      // 更新 commit id
      useRemoteLatestSha().value = result.data.data.repository.defaultBranchRef.target.history.nodes[0].oid;
    }
    return verified;
  }
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
  if (correctSha !== __NB_CURRENT_GIT_SHA__ && !(await createCommitModal())) {
    return false;
  }
  // 显示 diff 弹窗让用户确认更改
  if (!(await createDiffModal({ additions, deletions }))) {
    return false;
  }
  let add = "";
  let del = "";
  if (additions?.length) {
    add = "additions: [";
    additions.forEach((item) => {
      add += `{path: "${item.path}",contents: "${encodeB64(item.content)}"},`;
    });
    add += "],";
  }
  if (deletions?.length) {
    del = "deletions: [";
    deletions.forEach((item) => {
      del += `{path: "${item.path}"},`;
    });
    del += "]";
  }
  try {
    const result = await post(`mutation {
    createCommitOnBranch(
      input: {
        branch: {
          branchName: "${useRuntimeConfig().app.githubBranch}",
          repositoryNameWithOwner: "${config.githubName}/${__NB_GITHUB_REPO__}"
        },
        message: {
          headline: "[${formatTime()}]${commit}"
        },
        expectedHeadOid: "${correctSha}",
        fileChanges: {
          ${add}
          ${del}
        }
      }
    ) {
      clientMutationId
    }
  }`);
    const err = result.data.errors;
    if (err) {
      notify({
        title: err[0].type,
        type: "error",
        description: err[0].message
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
