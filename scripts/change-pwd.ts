import { CommonItem, HeaderTabUrl } from "../utils/types";
import { processEncryptDescrypt } from "../utils/process-encrypt-descrypt";
import { rebuildPath } from "./constants";

const fs = require("fs");
const path = require("path");
const CryptoJS = require("crypto-js");
const prompt = require("prompt");

let oldPwd_: string, newPwd_: string;

// eslint-disable-next-line require-await
const encrypt = async (s: string): Promise<string> => {
  return CryptoJS.AES.encrypt(s, newPwd_).toString();
};

// eslint-disable-next-line require-await
const decrypt = async (s: string): Promise<string> => {
  const result = CryptoJS.AES.decrypt(s, oldPwd_).toString(CryptoJS.enc.Utf8);
  if (!result) {
    console.error("密码错误");
    process.exit();
  }
  return result;
};

const processJson = async (file: HeaderTabUrl) => {
  const jsonPath = path.join(rebuildPath, "json", file + ".json");
  const itemList: CommonItem[] = JSON.parse(fs.readFileSync(jsonPath).toString());
  let count = 0;
  for (const item of itemList) {
    if (item.encrypt) {
      count += 1;
      await processEncryptDescrypt(item, decrypt, file);
      await processEncryptDescrypt(item, encrypt, file);
      fs.writeFileSync(jsonPath, JSON.stringify(itemList, null, 2));
      // markdown文件
      const mdPath = path.join(rebuildPath, file, String(item.id) + ".md");
      fs.writeFileSync(mdPath, await encrypt(await decrypt(fs.readFileSync(mdPath).toString())));
    }
  }
  console.log(file.substring(1) + `(共 ${count} 条) 处理完成`);
};

export default function () {
  prompt.start();
  prompt.get({
    properties: {
      oldPwd: {
        description: "旧密码",
        required: true
      },
      newPwd: {
        description: "新密码",
        required: true
      }
    }
  }, function (err, result) {
    if (err) {
      console.error(err);
      return;
    }
    oldPwd_ = result.oldPwd;
    newPwd_ = result.newPwd;
    ["/articles", "/records", "/knowledges"].map(processJson);
  });
}
