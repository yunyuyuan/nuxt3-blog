export default defineNuxtPlugin(() => {
  const router = useRouter();
  const loading = useLoading();
  router.beforeEach(() => {
    loading.start();
  });

  router.afterEach(() => {
    loading.finish();
  });
});
