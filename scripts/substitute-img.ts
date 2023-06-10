import fs from "fs";
import { processBlogItem, encryptAndWriteMd, encrypt, promptTask, ImgMap, getAbsolutePath } from "./utils";

export default async function () {
  await promptTask([{
    name: "pwd",
    type: "text",
    message: "password",
    validate: v => !!v
  }], async function (result) {
    const _encrypt = (s: string) => encrypt(s, result.pwd);

    const imgMap: ImgMap = JSON.parse(fs.readFileSync(getAbsolutePath("img.json")).toString());
    // https://s2.loli.net/\d{4}/\d{2}/\d{2}/[a-zA-Z0-9.]*
    // (https?:\/\/)?([\w.-]+)\.([a-zA-Z]{2,6})(\/[\w.-]*)*?\.(jpg|jpeg|webp|gif|png)

    const subImg = (s: string, path: string) => {
      let result = s;
      for (const [k, v] of Object.entries(imgMap)) {
        if (v.appearIn.includes(path) && v.newUrl !== k) {
          result = result.replace(k, v.newUrl);
        }
      }
      return result;
    };

    await processBlogItem(result.pwd, async ({ decryptedItem, decryptedMd, mdPath, type }) => {
      // 替换item里的图片
      const newItem = JSON.parse(subImg(JSON.stringify(decryptedItem, null, 2), mdPath));
      Object.assign(decryptedItem, newItem);
      // 替换markdown里的图片
      const newMd = subImg(decryptedMd, mdPath);
      await encryptAndWriteMd({
        item: decryptedItem,
        md: newMd,
        type,
        path: mdPath,
        encrypt: _encrypt
      });
    }, ({ decryptedItemList, jsonPath }) => {
      // 写入json，json本身是不加密的
      fs.writeFileSync(jsonPath, JSON.stringify(decryptedItemList, null, 2));
    });
  });
}
