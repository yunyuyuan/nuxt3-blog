// ContentRepository 的开发模式实现：通过 Vite WebSocket 让 nb-rebuild-plugin 改写本地文件
import { itemFilePath } from "../../common/content-body";
import { translate } from "../i18n";
import { getCurrentTab, devHotListen } from "../utils";
import { createDiffModal } from ".";
import type { CommitParams, CommitParamsAddition, CommonItem } from "#layers/nuxt3-blog/app/utils/common/types";
import { notify } from "#layers/nuxt3-blog/app/utils/nuxt/notify";
import { rebuildEvent } from "#layers/nuxt3-blog/vite-plugins/types";

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
  dels: { item: CommonItem; md: string }[]
): Promise<boolean> {
  const folder = getCurrentTab();
  return createCommit(
    `Delete ${dels.length} items from ${folder}`,
    {
      deletions: dels.map(item => ({
        path: itemFilePath(folder, item.item.id),
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
