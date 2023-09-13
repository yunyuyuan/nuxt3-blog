import fs from "fs";
import { ImgMap, getAbsolutePath, processBlogItem, promptTask } from "./utils";

export default async function (pwd?: string, reg?: string) {
  const fn = async function (result) {
    const regexp = RegExp(result.reg, "gi");

    const imgMap: ImgMap = {};
    // https://s2.loli.net/\d{4}/\d{2}/\d{2}/[a-zA-Z0-9.]*
    // (https?:\/\/)?([\w.-]+)\.([a-zA-Z]{2,6})(\/[\w.-]*)*?\.(jpg|jpeg|webp|gif|png|mp3|mp4)

    const pushImg = (s: string, path: string) => {
      let matcher;
      while (true) {
        matcher = regexp.exec(s);
        if (matcher) {
          if (imgMap[matcher[0]]) {
            imgMap[matcher[0]].appearIn.push(path);
          } else {
            imgMap[matcher[0]] = {
              newUrl: matcher[0],
              appearIn: [path]
            };
          }
        } else {
          break;
        }
      }
    };

    await processBlogItem(result.pwd, ({ decryptedMd, decryptedItem, mdPath }) => {
      // 寻找markdown里的图片
      pushImg(decryptedMd, mdPath);
      // 寻找item里的图片
      pushImg(JSON.stringify(decryptedItem), mdPath);
    });
    fs.writeFileSync(getAbsolutePath("img.json"), JSON.stringify(imgMap, null, 2));
  };
  if (pwd && reg) {
    fn({
      pwd,
      reg
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
      initial: "(https?:\\/\\/)?([\\w.-]+)\\.([a-zA-Z]{2,6})(\\/[\\w.-]*)*?\\.(jpg|jpeg|webp|gif|png)",
      validate: v => !!v
    }], fn);
  }
}
