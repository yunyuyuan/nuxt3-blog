import fs from "fs";
import colors from "colors";
import CryptoJS from "crypto-js";
import type { CommonItem, DecryptFunction, HeaderTabUrl } from "../../app/utils/common/types";
import { encryptDecryptItem, getEncryptedBlocks } from "../../app/utils/common/process-encrypt-decrypt";
import { walkAllBlogData } from ".";

export async function encrypt(s: string, pwd: string): Promise<string> {
  return CryptoJS.AES.encrypt(s, pwd).toString();
}

export async function decrypt(s: string, pwd: string): Promise<string> {
  const result = CryptoJS.AES.decrypt(s, pwd).toString(CryptoJS.enc.Utf8);
  if (!result) {
    console.error(colors.red("Password incorrect"));
    process.exit();
  }
  return result;
}

export async function processBlogItem(
  pwd: string,
  /** 单个item回调 */
  processItem: (_: { decryptedItem: CommonItem; decryptedMd: string; type: HeaderTabUrl; mdPath: string }) => any | Promise<any>,
  /** 整个json回调 */
  processJson: (_: { decryptedItemList: CommonItem[]; type: HeaderTabUrl; jsonPath: string }) => any | Promise<any> = () => null
) {
  const _decrypt = (s: string) => decrypt(s, pwd);

  const blogData = walkAllBlogData();
  for (const { type, jsonPath, list: itemList } of blogData) {
    let count = 0;
    for (const item of itemList) {
      let decryptedMd = item._md;
      if (item.encrypt) {
        // 解密item
        await encryptDecryptItem(item, _decrypt, type);
        // 解密markdown
        decryptedMd = await _decrypt(decryptedMd);
      } else if (item.encryptBlocks?.length) {
        // 解密 encrypted blocks
        for (const block of item.encryptBlocks) {
          const { start, end } = block;
          decryptedMd = decryptedMd.slice(0, start) + await _decrypt(decryptedMd.slice(start, end)) + decryptedMd.slice(end);
        }
      }
      await processItem({ decryptedItem: item, decryptedMd, type, mdPath: item._mdPath });
      count += 1;
    }
    await processJson({ decryptedItemList: itemList, type, jsonPath });
    console.log(colors.bold.bgCyan(type.substring(1) + ` (${count} in total) processing completed!`));
  }
}

/**
 * 重新加密md并写入文件，同时处理item里的encrypted blocks
 */
export async function encryptAndWriteMd({ item, md, path, encrypt, type }: { item: CommonItem; md: string; path: string; encrypt: DecryptFunction; type: HeaderTabUrl }) {
  if (item.encrypt) {
    // 重新加密item
    await encryptDecryptItem(item, encrypt, type);
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
