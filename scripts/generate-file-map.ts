import fs from "fs";
import type { FileMap } from "./utils";
import { getAbsolutePath, processBlogItem, promptTask } from "./utils";

const LEGACY_DEFAULT_REG = "(https?:\\/\\/)?([\\w.-]+)\\.([a-zA-Z]{2,6})(\\/[\\w.-]*)*?\\.(jpg|jpeg|webp|gif|png)";

function escapeRegExp(s: string) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function getDefaultReg() {
  const r2BaseUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL?.trim().replace(/\/$/, "");
  if (!r2BaseUrl) {
    return LEGACY_DEFAULT_REG;
  }
  // Match any public R2 object URL, regardless of file type.
  return `${escapeRegExp(r2BaseUrl)}\\/[^\\s"'<>]+`;
}

export default async function (pwd?: string, reg?: string) {
  const fn = async function (result) {
    const regexp = RegExp(result.reg, "gi");

    const fileMap: FileMap = {};

    const pushFile = (s: string, path: string) => {
      let matcher;
      while (true) {
        matcher = regexp.exec(s);
        if (matcher) {
          const url = matcher[0];
          if (fileMap[url]) {
            if (!fileMap[url].appearIn.includes(path)) {
              fileMap[url].appearIn.push(path);
            }
          } else {
            fileMap[url] = {
              newUrl: url,
              appearIn: [path]
            };
          }
        } else {
          break;
        }
      }
    };

    await processBlogItem(result.pwd, ({ decryptedMd, decryptedItem, mdPath }) => {
      // 遍历markdown里的文件链接
      pushFile(decryptedMd, mdPath);
      // 遍历item里的文件链接
      pushFile(JSON.stringify(decryptedItem), mdPath);
    }, undefined, {
      decryptErrorMode: "skip-item"
    });
    fs.writeFileSync(getAbsolutePath("file-map.json"), JSON.stringify(fileMap, null, 2));
  };
  if (pwd) {
    await fn({
      pwd,
      reg: reg || getDefaultReg()
    });
  } else {
    await promptTask([{
      name: "pwd",
      type: "text",
      message: "password",
      validate: v => !!v
    }, {
      name: "reg",
      type: "text",
      message: "RegExp",
      initial: getDefaultReg(),
      validate: v => !!v
    }], fn);
  }
}
