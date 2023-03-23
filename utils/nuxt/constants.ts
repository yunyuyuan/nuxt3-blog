export const inBrowser = process.client;
export const isPrerender = process.env.NODE_ENV === "prerender";
export const isDev = process.env.NODE_ENV === "development";
