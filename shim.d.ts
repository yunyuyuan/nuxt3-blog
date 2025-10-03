declare module "*?raw" {
  const content: string;
  export default content;
}

// Need a better way
declare module "ls:*github" {
  export const deleteList: typeof import("./utils/nuxt/manage/github")["deleteList"];
  export const createCommit: typeof import("./utils/nuxt/manage/github")["createCommit"];
  export const isAuthor: typeof import("./utils/nuxt/manage/github")["isAuthor"];
  export const commitStagedItems: typeof import("./utils/nuxt/manage/github")["commitStagedItems"];
}

declare const __NB_DATABASE_ENABLED__: string;
declare const __NB_CMTREPOID__: string;
declare const __NB_CMTREPOCATEID__: string;
declare const __NB_ALGOLIA_APP_ID__: string;
declare const __NB_ALGOLIA_SEARCH_KEY__: string;
declare const __NB_ALGOLIA_INDEX_NAME__: string;
declare const __NB_ALGOLIA_ENABLED__: boolean;
declare const __NB_BUILD_TIME__: string;
declare const __NB_GITHUB_REPO__: string;
declare const __NB_CURRENT_GIT_SHA__: string;
declare const __NB_BUILDTIME_VITESTING__: boolean;
declare const __NB_CURRENT_VERSION__: string;
