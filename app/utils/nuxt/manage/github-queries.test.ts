import { describe, expect, it } from "vitest";
import { encode } from "js-base64";
import { AuthorQuery, buildCommitInput, CreateCommitMutation } from "./github-queries";

describe("github queries", () => {
  it("keep every dynamic value in variables", () => {
    // 查询文档是固定字符串，不包含插值
    for (const doc of [AuthorQuery, CreateCommitMutation]) {
      expect(doc).not.toContain("${");
      expect(doc).toMatch(/^(query|mutation) \(\$/);
    }
  });

  it("builds CreateCommitOnBranchInput", () => {
    const input = buildCommitInput({
      owner: "me",
      repo: "blog",
      branch: "master",
      headline: "[2026-10-22]Update \"quoted\" \\ title",
      expectedHeadOid: "abc",
      additions: [{ path: "public/rebuild/json/articles.json", content: "[{\"title\":\"中文\"}]" }],
      deletions: [{ path: "public/rebuild/articles/1.md" }]
    }, encode);
    expect(input).toEqual({
      branch: { branchName: "master", repositoryNameWithOwner: "me/blog" },
      // 引号和反斜杠原样保留，由 JSON 序列化负责转义
      message: { headline: "[2026-10-22]Update \"quoted\" \\ title" },
      expectedHeadOid: "abc",
      fileChanges: {
        additions: [{ path: "public/rebuild/json/articles.json", contents: encode("[{\"title\":\"中文\"}]") }],
        deletions: [{ path: "public/rebuild/articles/1.md" }]
      }
    });
  });

  it("omits empty file change lists", () => {
    const input = buildCommitInput({ owner: "o", repo: "r", branch: "b", headline: "h", expectedHeadOid: "x", additions: [], deletions: [] }, encode);
    expect(input.fileChanges).toEqual({});
  });
});
