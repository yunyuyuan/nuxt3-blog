import { useState } from "#app";

import { GithubTokenKey } from "~/utils/common/constants";

// avoid loading during SSG
export const useFirstLoad = () => useState("first-loaded", () => true);

export const useGithubToken = () => useState(GithubTokenKey, () => "");
export const useIsAuthor = () => useState<null | boolean>("is-author", () => null);
export const useRemoteLatestSha = () => useState("remote-latest-sha", () => "");
export const useUnsavedContent = () => useState("unsaved-content", () => false);
