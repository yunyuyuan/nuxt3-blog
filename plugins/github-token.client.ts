import { inBrowser, GithubTokenKey } from "~/utils/constants";
import { getLocalStorage } from "~/utils/utils";
import { isAuthor } from "~/utils/manage/github";
import { notify } from "~/utils/notify/notify";

export default defineNuxtPlugin(() => {
  if (useRuntimeConfig().public.dev) {
    useGithubToken().value = "LocalServer";
    return;
  }

  const localToken = getLocalStorage(GithubTokenKey);
  if (inBrowser && localToken) {
    // 进入界面时，检查token
    isAuthor(localToken)
      .then((res) => {
        notify({
          title: res ? "Token验证成功!" : "Token错误!",
          type: res ? "success" : "error"
        });
      })
      .catch((e) => {
        notify({
          title: "Token验证出错了",
          type: "error",
          description: e
        });
      });
  }
});
