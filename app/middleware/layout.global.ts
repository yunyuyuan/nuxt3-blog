export default defineNuxtRouteMiddleware((to) => {
  if (to.fullPath.startsWith("/manage")) {
    to.meta.layout = "manage";
    // manage 内容包在 <client-only> 里且页面异步加载，out-in 会先删旧页再等新页 resolve，
    // 中间出现空窗导致切 tab 白屏。manage 是纯客户端后台区，直接禁用页面过渡。
    to.meta.pageTransition = false;
  }
});
