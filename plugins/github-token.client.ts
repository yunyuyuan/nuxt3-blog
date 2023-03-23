import { GithubTokenKey } from "~/utils/common";
import { getLocalStorage, notify, isAuthor, translate, isDev, inBrowser } from "~/utils/nuxt";

export default defineNuxtPlugin(() => {
  if (isDev) {
    useGithubToken().value = "LocalServer";
    useIsAuthor().value = true;
    return;
  }

  const localToken = getLocalStorage(GithubTokenKey);
  if (inBrowser && localToken) {
    // 进入界面时，检查token
    isAuthor(localToken)
      .then((res) => {
        notify({
          title: res ? translate("token-verified") : translate("token-unverified"),
          type: res ? "success" : "error"
        });
        useIsAuthor().value = res;
      })
      .catch((e) => {
        notify({
          title: translate("token-unverified"),
          type: "error",
          description: e
        });
        useIsAuthor().value = false;
      });
  } else {
    useIsAuthor().value = false;
  }
});
