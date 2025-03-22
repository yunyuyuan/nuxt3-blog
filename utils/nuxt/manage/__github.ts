import { translate } from "../i18n";
import { getCurrentTab, devHotListen } from "../utils";
import type { CommitParams, CommonItem } from "~/utils/common/types";
import { notify } from "~/utils/nuxt/notify";
import { rebuildEvent } from "~/vite-plugins/types";

export function isAuthor(): never {
  throw new Error("Can't do that");
}

export function createCommit(
  _commit = "",
  { additions, deletions }: CommitParams
): Promise<boolean> {
  import.meta.hot!.send(rebuildEvent, {
    additions,
    deletions
  });
  return listenServer();
}

export function deleteList(
  newList: CommonItem[],
  dels: CommonItem[]
): Promise<boolean> {
  const folder = getCurrentTab();
  import.meta.hot!.send(rebuildEvent, {
    additions: [{
      path: `public/rebuild/json${folder}.json`,
      content: JSON.stringify(newList)
    }],
    deletions: dels.map(item => ({
      path: `public/rebuild${folder}/${item.id}.md`
    }))
  });
  return listenServer();
}

function listenServer(): Promise<boolean> {
  return new Promise((resolve, reject) => {
    devHotListen(rebuildEvent, (data) => {
      if (typeof data === "boolean") {
        resolve(data);
        if (data) {
          notify({
            title: translate("update-success"),
            description: translate("refresh-after-sec", [1])
          });
          setTimeout(() => {
            location.reload();
          }, 1000);
        }
      } else {
        reject(data);
      }
    });
  });
}
