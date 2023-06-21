import { useUnlocalePath } from "~/utils/nuxt";

export default defineNuxtRouteMiddleware((to) => {
  if (useUnlocalePath(to.fullPath).startsWith("/manage")) {
    to.meta.layout = "manage";
  }
});
