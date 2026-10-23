// GitHub GraphQL 文档与变量构建。这个文件不依赖 Nuxt，方便单独测试和用 GitHub schema 校验。
// 所有动态值都通过 variables 传入，不拼接进查询字符串：标题里的引号、反斜杠不会破坏查询。

/** 验证 token 属于博客作者，并读取分支最新的 commit oid */
export const AuthorQuery = `query ($owner: String!, $name: String!, $branch: String!) {
  viewer {
    login
  }
  repository(owner: $owner, name: $name) {
    ref(qualifiedName: $branch) {
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
}`;

export type AuthorQueryData = {
  viewer?: { login?: string };
  repository?: { ref?: { target?: { history?: { nodes?: { oid: string }[] } } } };
};

/**
 * 一次读取某个提交中一个目录的全部文件（后台的条目列表）。
 * expression 形如 "<commit oid>:public/rebuild/articles"。Blob 过大时 text 会被截断（isTruncated），调用方要单独读取。
 */
export const HeadDirectoryQuery = `query ($owner: String!, $name: String!, $expression: String!) {
  repository(owner: $owner, name: $name) {
    object(expression: $expression) {
      ... on Tree {
        entries {
          name
          type
          object {
            ... on Blob {
              text
              isTruncated
            }
          }
        }
      }
    }
  }
}`;
export type HeadDirectoryEntry = {
  name: string;
  type: string;
  object?: { text?: string | null; isTruncated?: boolean } | null;
};
export type HeadDirectoryData = {
  // 目录不存在时 object 为 null
  repository?: { object?: { entries?: HeadDirectoryEntry[] } | null } | null;
};
export const CreateCommitMutation = `mutation ($input: CreateCommitOnBranchInput!) {
  createCommitOnBranch(input: $input) {
    commit {
      oid
    }
  }
}`;

export type CreateCommitData = {
  createCommitOnBranch?: { commit?: { oid: string } };
};

export type CommitInputParams = {
  owner: string;
  repo: string;
  branch: string;
  headline: string;
  expectedHeadOid: string;
  additions?: { path: string; content: string }[];
  deletions?: { path: string }[];
};

/** 生成 CreateCommitOnBranchInput；encode 把文件内容转成 base64（UTF-8） */
export function buildCommitInput(p: CommitInputParams, encode: (_: string) => string) {
  const fileChanges: {
    additions?: { path: string; contents: string }[];
    deletions?: { path: string }[];
  } = {};
  if (p.additions?.length) {
    fileChanges.additions = p.additions.map(item => ({ path: item.path, contents: encode(item.content) }));
  }
  if (p.deletions?.length) {
    fileChanges.deletions = p.deletions.map(item => ({ path: item.path }));
  }
  return {
    branch: {
      branchName: p.branch,
      repositoryNameWithOwner: `${p.owner}/${p.repo}`
    },
    message: {
      headline: p.headline
    },
    expectedHeadOid: p.expectedHeadOid,
    fileChanges
  };
}
