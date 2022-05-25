declare module "*?raw" {
  const content: string;
  export default content;
}

// Need a better way
declare module "ls:*github" {
  export const deleteList: typeof import("./utils/manage/github")["deleteList"];
  export const createCommit: typeof import("./utils/manage/github")["createCommit"];
  export const isAuthor: typeof import("./utils/manage/github")["isAuthor"];
}
