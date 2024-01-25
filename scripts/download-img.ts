import fs from "fs";
import path from "path";
import https from "https";
import colors from "colors";
import { ImgMap, getAbsolutePath } from "./utils";

export default async function (user?: number, group?: number) {
  await downloadImages(JSON.parse(fs.readFileSync(getAbsolutePath("img.json")).toString()), user, group);
}

const imgsPath = getAbsolutePath("imgs");

function sleep () {
  return new Promise<void>((resolve) => {
    setTimeout(resolve, Math.floor(Math.random() * (3000 + 1)) + 2000);
  });
}

async function downloadImages (json: ImgMap, user?: number, group?: number) {
  const urls = Object.keys(json);

  if (!fs.existsSync(imgsPath)) {
    fs.mkdirSync(imgsPath);
  }

  let succeedCount = 0;
  for (const url of urls) {
    let count = 0;
    while (true) {
      try {
        const res = await downloadImage(url, user, group);
        if (res !== null) {
          await sleep();
        }
        succeedCount += 1;
        break;
      } catch {
        count += 1;
        if (count > 2) {
          console.log(`3 times failed, ignore ${url}`);
          break;
        }
        console.log(`sleep and try again(${count})`);
        await sleep();
      }
    }
  }
  console.log(colors.bold("Downloaded " + colors.green(succeedCount + "/" + urls.length + " items")));
}

function downloadImage (url: string, user?: number, group?: number) {
  return new Promise<boolean | null>((resolve, reject) => {
    const fileName = path.join(imgsPath, url.replace(/^.*?([^/]*)$/, "$1"));
    if (fs.existsSync(fileName)) {
      console.log(`${fileName} existed, ignore...`);
      resolve(null);
      return;
    }
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        console.log(`Failed to Download ${fileName}: ${response.statusCode}`);
        reject();
        return;
      }

      const fileStream = fs.createWriteStream(fileName);

      response.pipe(fileStream);
      fileStream.on("finish", () => {
        if (user && group) {
          fs.chown(fileName, user, group, () => undefined);
        }
        console.log(`Downloaded ${url} as ${fileName}`);
        resolve(true);
      });
    }).on("error", (error) => {
      console.log(`Error downloading ${url}: ${error}`);
      reject();
    });
  });
}
