export default defineNuxtPlugin((app) => {
  const router = useRouter();
  const loading = useLoading();
  const firstLoad = useFirstLoad();
  let index = 0;
  router.beforeEach((to, from) => {
    if (to.path === from.path) {
      return;
    }
    if (index < 2) {
      index += 1;
    }
    if (index === 2 && firstLoad.value) {
      firstLoad.value = false;
    }
    loading.start();
  });

  app.hook("page:finish", () => {
    loading.finish();
  });
});
