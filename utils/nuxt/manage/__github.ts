import type { CommonItem } from "~/utils/common";
import { notify, translate, devHotListen, useCurrentTab } from "~/utils/nuxt";
import type { UpdateRebuild } from "~/vite-plugins/rebuild";
import { rebuildEvent } from "~/vite-plugins/types";

export function isAuthor (): never {
  throw new Error("Can't do that");
}

export function createCommit (
  _commit = "",
  additions: { path: string; content: string }[] = [],
  deletions: { path: string }[] = []
): Promise<boolean> {
  import.meta.hot!.send(rebuildEvent, {
    additions,
    deletions
  } as UpdateRebuild);
  return listenServer();
}

export function deleteList (
  newList: CommonItem[],
  dels: CommonItem[]
): Promise<boolean | void> {
  const folder = useCurrentTab().url;
  import.meta.hot!.send(rebuildEvent, {
    additions: [{
      path: `public/rebuild/json${folder}.json`,
      content: JSON.stringify(newList, null, 2)
    }],
    deletions: dels.map(item => ({
      path: `public/rebuild${folder}/${item.id}.md`
    }))
  } as UpdateRebuild);
  return listenServer();
}

function listenServer (): Promise<boolean> {
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
