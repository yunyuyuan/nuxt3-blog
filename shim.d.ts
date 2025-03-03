declare module "*?raw" {
  const content: string;
  export default content;
}

// Need a better way
declare module "ls:*github" {
  export const deleteList: typeof import("./utils/nuxt/manage/github")["deleteList"];
  export const createCommit: typeof import("./utils/nuxt/manage/github")["createCommit"];
  export const isAuthor: typeof import("./utils/nuxt/manage/github")["isAuthor"];
}

declare const __NB_MONGODB_ENABLED__: string;
declare const __NB_COMMENTING_ENABLED__: string;
declare const __NB_BUILD_TIME__: string;
declare const __NB_CURRENT_GIT_SHA__: string;
declare const __NB_VITESTING__: boolean;
