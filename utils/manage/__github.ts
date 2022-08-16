import { CommonItem } from "../types";
import { notify } from "../notify/notify";
import { UpdateRebuild } from "~/local-server";

export function isAuthor (): never {
  throw new Error("Can't do that");
}

export function createCommit (
  _commit = "",
  additions: { path: string; content: string }[] = [],
  deletions: { path: string }[] = []
): Promise<boolean> {
  import.meta.hot.send("rebuild:update", {
    additions,
    deletions
  } as UpdateRebuild);
  return listenServer();
}

export function deleteList (
  newList: CommonItem[],
  dels: CommonItem[]
): Promise<boolean | void> {
  const folder = useCurrentTab().value.url;
  import.meta.hot.send("rebuild:update", {
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
    import.meta.hot.on("rebuild:result", (data) => {
      if (typeof data === "boolean") {
        resolve(data);
        if (data) {
          notify({
            title: "更新成功",
            description: "1秒后将自动刷新页面"
          });
          setTimeout(() => {
            import.meta.hot.invalidate();
          }, 1000);
        }
      } else {
        reject(data);
      }
    });
  });
}
