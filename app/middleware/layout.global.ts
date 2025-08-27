export default defineNuxtRouteMiddleware((to) => {
  if (to.fullPath.startsWith("/manage")) {
    to.meta.layout = "manage";
  }
});
