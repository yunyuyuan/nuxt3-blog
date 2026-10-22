import * as github from "./github";
import * as local from "./local-repository";
import type { CommitParams, CommitParamsAddition, CommonItem } from "~/utils/common/types";

/**
 * 后台写入内容的方式。
 * - github.ts：调用 GitHub GraphQL 提交到仓库（生产构建和测试构建）
 * - local-repository.ts：通过 Vite WebSocket 改写本地文件（开发模式）
 */
export interface ContentRepository {
  /** token 对应的用户能否写入博客仓库 */
  isAuthor(token: string): Promise<boolean>;
  /** 提交一组文件的新增和删除，返回是否成功 */
  createCommit(message: string, params: CommitParams): Promise<boolean>;
  /** 删除当前栏目的若干条目：写入新列表并删除对应的 md */
  deleteList(newList: CommonItem[], dels: { item: CommonItem; md: string }[]): Promise<boolean>;
  /** 一次提交暂存区的全部修改 */
  commitStagedItems(additions: CommitParamsAddition[]): Promise<boolean>;
}

// 条件与原来的 ls: 插件相同：开发模式且不是测试时写本地文件。
// import.meta.dev 在构建时被替换成常量，生产包里不包含本地实现
const repository: ContentRepository = import.meta.dev && !__NB_BUILDTIME_VITESTING__ ? local : github;

export const { isAuthor, createCommit, deleteList, commitStagedItems } = repository;
