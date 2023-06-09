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
