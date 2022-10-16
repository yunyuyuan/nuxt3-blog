export default defineNuxtPlugin(() => {
  const router = useRouter();
  const loading = useLoading();
  const firstLoad = useFirstLoad();
  let index = 0;
  router.beforeEach(() => {
    if (index < 2) {
      index += 1;
    }
    if (index === 2 && firstLoad.value) {
      firstLoad.value = false;
    }
    loading.start();
  });

  router.afterEach(() => {
    loading.finish();
  });
});
