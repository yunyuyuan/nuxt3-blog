import colors from "colors";
import CryptoJS from "crypto-js";
import type { CommonItem, DecryptFunction, HeaderTabUrl } from "../../app/utils/common/types";
import { decryptEncryptBlocks, encryptDecryptItem, getEncryptedBlocks } from "../../app/utils/common/process-encrypt-decrypt";
import { writeContentEntry } from "./content";
import { walkAllBlogData } from ".";

export async function encrypt(s: string, pwd: string): Promise<string> {
  return CryptoJS.AES.encrypt(s, pwd).toString();
}

export async function decrypt(s: string, pwd: string): Promise<string> {
  const result = CryptoJS.AES.decrypt(s, pwd).toString(CryptoJS.enc.Utf8);
  if (!result) {
    throw new Error("Password incorrect or decrypt failed");
  }
  return result;
}

export async function processBlogItem(
  pwd: string,
  /** 单个item回调 */
  processItem: (_: { decryptedItem: CommonItem; decryptedMd: string; type: HeaderTabUrl; mdPath: string }) => any | Promise<any>,
  options: {
    decryptErrorMode?: "throw" | "skip-item";
  } = {}
) {
  const _decrypt = (s: string) => decrypt(s, pwd);
  const decryptErrorMode = options.decryptErrorMode || "throw";

  const blogData = walkAllBlogData();
  for (const { type, list: itemList } of blogData) {
    let count = 0;
    for (const item of itemList) {
      try {
        let decryptedMd = item._md;
        if (item.encrypt) {
          // 解密item
          await encryptDecryptItem(item, _decrypt, type);
          // 解密markdown
          decryptedMd = await _decrypt(decryptedMd);
        } else if (item.encryptBlocks?.length) {
          // 解密 encrypted blocks（位置从 [encrypt] 标记解析）
          decryptedMd = await decryptEncryptBlocks(decryptedMd, _decrypt);
        }
        await processItem({ decryptedItem: item, decryptedMd, type, mdPath: item._mdPath });
        count += 1;
        delete (item as Partial<typeof item>)._md;
        delete (item as Partial<typeof item>)._mdPath;
      } catch (e) {
        if (decryptErrorMode === "skip-item") {
          console.warn(colors.yellow(`Skip item ${String(item.id)} in ${type}: ${(e as Error)?.message || e}`));
          continue;
        }
        throw e;
      }
    }
    console.log(colors.bold.bgCyan(type.substring(1) + ` (${count} in total) processing completed!`));
  }
}

/**
 * 重新加密条目并写入条目文件（frontmatter + 正文）
 */
export async function encryptAndWriteMd({ item, md, path, encrypt, type }: { item: CommonItem; md: string; path: string; encrypt: DecryptFunction; type: HeaderTabUrl }) {
  if (item.encrypt) {
    // 重新加密 frontmatter 中的字段和正文
    await encryptDecryptItem(item, encrypt, type);
    writeContentEntry(path, type, item, await encrypt(md));
  } else if (item.encryptBlocks) {
    // 重新加密 blocks；位置在读取时从 [encrypt] 标记解析，不写入文件
    const { md: encryptedMd } = await getEncryptedBlocks(md, encrypt);
    writeContentEntry(path, type, item, encryptedMd);
  } else {
    writeContentEntry(path, type, item, md);
  }
}
