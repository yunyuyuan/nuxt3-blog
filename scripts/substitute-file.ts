import fs from "fs";
import type { FileMap } from "./utils";
import { processBlogItem, encryptAndWriteMd, encrypt, promptTask, getAbsolutePath } from "./utils";

export default async function () {
  await promptTask([{
    name: "pwd",
    type: "text",
    message: "password",
    validate: v => !!v
  }], async function (result) {
    const _encrypt = (s: string) => encrypt(s, result.pwd);

    const fileMap: FileMap = JSON.parse(fs.readFileSync(getAbsolutePath("file-map.json")).toString());

    const subFile = (s: string, path: string) => {
      let result = s;
      for (const [k, v] of Object.entries(fileMap)) {
        if (v.appearIn.includes(path) && v.newUrl !== k) {
          result = result.replace(k, v.newUrl);
        }
      }
      return result;
    };

    await processBlogItem(result.pwd, async ({ decryptedItem, decryptedMd, mdPath, type }) => {
      // 替换item里的文件链接
      const newItem = JSON.parse(subFile(JSON.stringify(decryptedItem), mdPath));
      Object.assign(decryptedItem, newItem);
      // 替换markdown里的文件链接
      const newMd = subFile(decryptedMd, mdPath);
      await encryptAndWriteMd({
        item: decryptedItem,
        md: newMd,
        type,
        path: mdPath,
        encrypt: _encrypt
      });
    }, ({ decryptedItemList, jsonPath }) => {
      // 写入json，json本身是不加密的
      fs.writeFileSync(jsonPath, JSON.stringify(decryptedItemList));
    }, {
      decryptErrorMode: "skip-item"
    });
  });
}
