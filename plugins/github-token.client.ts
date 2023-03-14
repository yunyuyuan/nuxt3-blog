import { isDev, inBrowser, GithubTokenKey } from "~/utils/constants";
import { getLocalStorage } from "~/utils/utils";
import { translate } from "~/utils/i18n";
import { isAuthor } from "~/utils/manage/github";
import { notify } from "~/utils/notify/notify";

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
