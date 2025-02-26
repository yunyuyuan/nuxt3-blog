import type { NuxtPage } from "@nuxt/test-utils";

export const timeout = (sec = 1000) => new Promise((resolve) => {
  setTimeout(resolve, sec);
});

export const mockGithubGraphApi = async (page: NuxtPage) => {
  const requestDataPromise = ref<string>();
  await page.route("https://api.github.com/graphql", async route => {
    const postData = route.request().postData();
    requestDataPromise.value = postData || "";
    await route.fulfill({ json: { data: {} } });
  });
  return requestDataPromise;
};

export const confirmForceCommit = async (page: NuxtPage) => {
  await timeout(200);
  const confirmBtn = await page.getByTestId("force-commit-confirm");
  if (confirmBtn) {
    await confirmBtn.click();
  }
};