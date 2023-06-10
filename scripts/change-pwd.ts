import fs from "fs";
import { processBlogItem, encrypt, encryptAndWriteMd, promptTask } from "./utils";

export default async function () {
  await promptTask([
    {
      name: "oldPwd",
      type: "text",
      message: "Old password",
      validate: v => !!v
    }, {
      name: "newPwd",
      type: "text",
      message: "New password",
      validate: v => !!v
    }
  ], async function (result) {
    const _encrypt = (s: string) => encrypt(s, result.newPwd);

    await processBlogItem(result.oldPwd, async ({ decryptedItem, decryptedMd, type, mdPath }) => {
      await encryptAndWriteMd({
        item: decryptedItem,
        md: decryptedMd,
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
