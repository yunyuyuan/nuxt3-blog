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
// __NB_*__ 常量的类型由 modules/blog.ts 生成（.nuxt/types/nuxt3-blog-defines.d.ts）
