import fs from "fs";
import colors from "colors";
import CryptoJS from "crypto-js";
import { CommonItem, DecryptFunction, processEncryptDecrypt, HeaderTabUrl, getEncryptedBlocks, escapeNewLine } from "../../utils/common";
import { getRebuildPath } from ".";

// eslint-disable-next-line require-await
export async function encrypt (s: string, pwd: string): Promise<string> {
  return CryptoJS.AES.encrypt(s, pwd).toString();
}
// eslint-disable-next-line require-await
export async function decrypt (s: string, pwd: string): Promise<string> {
  const result = CryptoJS.AES.decrypt(s, pwd).toString(CryptoJS.enc.Utf8);
  if (!result) {
    console.error(colors.red("Password incorrect"));
    process.exit();
  }
  return result;
}

export function processBlogItem (
  pwd: string,
  /** 单个item回调 */
  itemCb: (_: {decryptedItem: CommonItem, decryptedMd: string, type: HeaderTabUrl, mdPath: string}) => any | Promise<any>,
  /** 整个json回调 */
  jsonCb: (_: {decryptedItemList: CommonItem[], type: HeaderTabUrl, jsonPath: string}) => any | Promise<any> = () => null
) {
  const _decrypt = (s: string) => decrypt(s, pwd);

  const processJson = async (type: HeaderTabUrl) => {
    const jsonPath = getRebuildPath("json", type + ".json");
    const itemList: CommonItem[] = JSON.parse(fs.readFileSync(jsonPath).toString());
    let count = 0;
    for (const item of itemList) {
      const mdPath = getRebuildPath(type, String(item.id) + ".md");
      let decryptedMd = escapeNewLine(fs.readFileSync(mdPath).toString());
      if (item.encrypt) {
        // 解密item
        await processEncryptDecrypt(item, _decrypt, type);
        // 解密markdown
        decryptedMd = await _decrypt(decryptedMd);
      } else if (item.encryptBlocks?.length) {
        // 解密 encrypted blocks
        for (const block of item.encryptBlocks) {
          const { start, end } = block;
          decryptedMd = decryptedMd.slice(0, start) + await _decrypt(decryptedMd.slice(start, end)) + decryptedMd.slice(end);
        }
      }
      await itemCb({ decryptedItem: item, decryptedMd, type, mdPath });
      count += 1;
    }
    await jsonCb({ decryptedItemList: itemList, type, jsonPath });
    console.log(colors.bold.bgCyan(type.substring(1) + ` (${count} in total) processing completed!`));
  };

  return Promise.all(["/articles", "/records", "/knowledges"].map(processJson));
}

/**
 * 重新加密md并写入文件，同时处理item里的encrypted blocks
 */
export async function encryptAndWriteMd ({ item, md, path, encrypt, type }: {item: CommonItem, md: string, path: string, encrypt: DecryptFunction, type: HeaderTabUrl}) {
  if (item.encrypt) {
    // 重新加密item
    await processEncryptDecrypt(item, encrypt, type);
    // 重新加密markdown
    const encryptedMd = await encrypt(md);
    fs.writeFileSync(path, encryptedMd);
  } else if (item.encryptBlocks) {
    // 重新加密blocks
    const { md: encryptedMd, blocks } = await getEncryptedBlocks(md, encrypt);
    fs.writeFileSync(path, encryptedMd);
    if (blocks.length) {
      item.encryptBlocks = blocks.reverse();
    } else {
      delete item.encryptBlocks;
    }
  } else {
    fs.writeFileSync(path, md);
  }
}
