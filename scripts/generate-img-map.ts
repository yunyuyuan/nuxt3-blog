import { processBlogItem } from ".";

const fs = require("fs");
const prompt = require("prompt");

export type ImgMap = Record<string, {
  newUrl: string,
  appearIn: string[]
}>

export default async function () {
  prompt.start();
  await new Promise<void>((resolve) => {
    prompt.get({
      properties: {
        pwd: {
          description: "password",
          required: true
        },
        reg: {
          description: "RegExp",
          required: true
        }
      }
    }, async function (err, result) {
      if (err) {
        console.error(err);
        return;
      }
      const regexp = RegExp(result.reg, "gi");

      const imgMap: ImgMap = {};
      // https://s2.loli.net/\d{4}/\d{2}/\d{2}/[a-zA-Z0-9.]*
      // (https?:\/\/)?([\w.-]+)\.([a-zA-Z]{2,6})(\/[\w.-]*)*?\.(jpg|jpeg|webp|gif|png)

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
      fs.writeFileSync("img.json", JSON.stringify(imgMap, null, 2));
      resolve();
    });
  });
}
