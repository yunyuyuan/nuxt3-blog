// 用 Nuxt 提供的 import.meta 标志，不读 process.env.NODE_ENV：vite 8 的服务端构建会把
// process.env.NODE_ENV 静态替换为 "production"，预渲染时的判断就恒为 false。
// 预渲染使用 Nitro 单独构建的服务端，其中 import.meta.prerender 为 true
export const isPrerender = import.meta.prerender;
export const isDev = import.meta.dev;
