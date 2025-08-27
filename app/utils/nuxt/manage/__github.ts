import { translate } from "../i18n";
import { getCurrentTab, devHotListen } from "../utils";
import { createDiffModal } from ".";
import type { CommitParams, CommitParamsAddition, CommonItem } from "~/utils/common/types";
import { notify } from "~/utils/nuxt/notify";
import { rebuildEvent } from "~~/vite-plugins/types";

export function isAuthor(): never {
  throw new Error("Can't do that");
}

export async function createCommit(
  _commit = "",
  { additions, deletions }: CommitParams
): Promise<boolean> {
  // 显示 diff 弹窗让用户确认更改
  if (!(await createDiffModal({ additions, deletions }))) {
    return false;
  }
  import.meta.hot!.send(rebuildEvent, {
    additions,
    deletions
  });
  return listenServer();
}

export async function deleteList(
  newList: CommonItem[],
  dels: { item: CommonItem; md: string }[]
): Promise<boolean> {
  const folder = getCurrentTab();
  return createCommit(
    `Delete ${dels.length} items from ${folder}`,
    {
      additions: [{
        path: `public/rebuild/json${folder}.json`,
        content: JSON.stringify(newList)
      }],
      deletions: dels.map(item => ({
        path: `public/rebuild${folder}/${item.item.id}.md`,
        content: item.md
      }))
    }
  );
}

export async function commitStagedItems(
  additions: CommitParamsAddition[]
): Promise<boolean> {
  if (additions.length === 0) {
    return true;
  }

  const commitMessage = `Batch update ${additions.length} items`;
  return createCommit(commitMessage, { additions });
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
