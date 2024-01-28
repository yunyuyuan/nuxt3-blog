import type { Axios } from "axios";
import type { CommonItem } from "~/utils/common";
import { useCurrentTab, translate, formatTime, notify, createCommitModal } from "~/utils/nuxt";
import config from "~/config";

let axios: Axios | null = null;

async function post (data: string, token_?: string) {
  const token = token_ || useGithubToken().value;
  if (!token) {
    throw new Error(translate("need-token"));
  }
  axios = axios || (await import("axios")).default;
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

function encodeB64 (str: string) {
  return btoa(unescape(encodeURIComponent(str)));
}

/** @description 是否管理员 */
export async function isAuthor (token: string): Promise<boolean> {
  const result = await post(
    `query {
    viewer {
      login
    }
    repository(name: "${config.githubRepo}", owner: "${config.githubName}") {
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
      useCorrectSha().value = result.data.data.repository.defaultBranchRef.target.history.nodes[0].oid;
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
export async function createCommit (
  commit = "",
  additions: { path: string; content: string }[] = [],
  deletions: { path: string }[] = []
): Promise<boolean> {
  const correctSha = useCorrectSha().value;
  if (!useNuxtApp().$sameSha.value && !(await createCommitModal())) {
    throw new Error("Interrupt by user");
  }
  let add = "";
  let del = "";
  if (additions.length) {
    add = "additions: [";
    additions.forEach((item) => {
      add += `{path: "${item.path}",contents: "${encodeB64(item.content)}"},`;
    });
    add += "],";
  }
  if (deletions.length) {
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
          repositoryNameWithOwner: "${config.githubName}/${config.githubRepo}"
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
export function deleteList (
  newList: CommonItem[],
  dels: CommonItem[]
): Promise<boolean | void> {
  const commitInfo =
    dels.length === 1 ? `'${dels[0].id}'` : `${dels.length} items`;
  const folder = useCurrentTab().url;
  return createCommit(
    `Delete ${commitInfo} from ${folder}`,
    [
      {
        path: `public/rebuild/json${folder}.json`,
        content: JSON.stringify(newList, null, 2)
      }
    ],
    dels.map(item => ({
      path: `public/rebuild${folder}/${item.id}.md`
    }))
  );
}
