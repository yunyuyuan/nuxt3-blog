import config from "~/config";

export const inBrowser = import.meta.client;
export const isPrerender = process.env.NODE_ENV === "prerender";
export const isDev = process.env.NODE_ENV === "development";

export const cmtRepId = config.CommentRepoId || process.env.CommentRepoId;
export const cmtRepCateId = config.CommentDiscussionCategoryId || process.env.CommentDiscussionCategoryId;
