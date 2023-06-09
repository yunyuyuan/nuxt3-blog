import { processBlogItem, encrypt, encryptAndWriteMd } from ".";

const fs = require("fs");
const prompt = require("prompt");

export default async function () {
  prompt.start();
  await new Promise<void>((resolve) => {
    prompt.get({
      properties: {
        oldPwd: {
          description: "Old password",
          required: true
        },
        newPwd: {
          description: "New password",
          required: true
        }
      }
    }, async function (err, result) {
      if (err) {
        console.error(err);
        return;
      }
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
      resolve();
    });
  });
}
