export default defineNuxtPlugin(() => {
  const router = useRouter();
  const loading = useLoading();
  const firstLoad = useFirstLoad();
  router.beforeEach(() => {
    if (firstLoad.value) {
      firstLoad.value = false;
    }
    loading.start();
  });

  router.afterEach(() => {
    loading.finish();
  });
});
