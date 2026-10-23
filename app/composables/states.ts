import { useState } from "#app";

import { GithubTokenKey } from "~/utils/common/constants";

// avoid loading during SSG
export const useFirstLoad = () => useState("first-loaded", () => true);

export const useGithubToken = () => useState(GithubTokenKey, () => "");
export const useIsAuthor = () => useState<null | boolean>("is-author", () => null);
// 后台读取内容时所在的提交，也是下一次提交的 expectedHeadOid
export const useRemoteLatestSha = () => useState("remote-latest-sha", () => "");
// 后台页面外层容器的 key。改变它会重新挂载当前后台页面并重新读取内容，代替整页刷新
export const useManageReloadKey = () => useState("manage-reload-key", () => 0);
export const reloadManagePage = () => {
  useManageReloadKey().value++;
};
export const useUnsavedContent = () => useState("unsaved-content", () => false);
export const useShowPwdModal = () => useState("show-pwd-modal", () => false);
export const useModalZIndex = () => {
  const zIndex = useState("modal-z-index", () => 999);
  const getZIndex = () => {
    return ++zIndex.value;
  };
  return {
    _zIndex: zIndex,
    getZIndex
  };
};
