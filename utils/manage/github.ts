import { CommonItem } from "../types";
import { getNowDayjs } from "~/utils/_dayjs";
import config from "~/config";
import { notify } from "~/utils/notify/notify";
import { TargetTab } from "~/plugins/target-tab";

async function post (data: string, token_?: string) {
  const token = token_ || useGithubToken().value;
  if (!token) {
    throw new Error("缺少token");
  }
  const axios = (await import("axios")).default as any;
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
  }`,
    token
  );
  const err = result.data.errors;
  if (err) {
    throw new Error(err);
  } else {
    const verified = result.data.data.viewer.login === config.githubName;
    if (verified) {
      // 验证 commit id
      useGithubToken().value = token;
      const app = useRuntimeConfig().app;
      getCommitId().then((commitId) => {
        if (commitId && commitId.startsWith(app.NUXT_ENV_CURRENT_GIT_SHA)) {
          useCorrectCommitId().value = true;
        }
      });
    }
    return verified;
  }
}

/** @description 获取最后一个 commit id */
async function getCommitId (): Promise<string> {
  const result = await post(`query {
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
  }`);
  const err = result.data.errors;
  if (err) {
    notify({
      type: "error",
      title: err[0].type,
      description: err[0].message
    });
  } else {
    return result.data.data.repository.defaultBranchRef.target.history.nodes[0]
      .oid;
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
  const app = useRuntimeConfig().app;
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
          branchName: "${config.githubBranch}",
          repositoryNameWithOwner: "${config.githubName}/${config.githubRepo}"
        },
        message: {
          headline: "[🤖${getNowDayjs().format(
    "YYYY-MM-DD HH:mm:ss"
  )}]${commit}"
        },
        expectedHeadOid: "${app.NUXT_ENV_CURRENT_GIT_SHA}",
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
      title: "更新成功",
      description: "请等待编译，1秒后将自动刷新页面"
    });
    // 更新成功必刷新页面，防止后续操作commit id不正确。若存在草稿，此操作依旧会被beforeUnload拦截
    setTimeout(() => {
      window.location.reload();
    }, 1000);
    return true;
  } catch (e) {
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
    dels.length === 1 ? `"${dels[0].id}"` : `${dels.length} items`;
  const targetTab: TargetTab = useNuxtApp().$targetTab.value;
  const folder = targetTab.targetTab.url;
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
