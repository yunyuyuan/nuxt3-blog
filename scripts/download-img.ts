import fs from "fs";
import path from "path";
import https from "https";
import colors from "colors";
import { ImgMap, getAbsolutePath } from "./utils";

export default async function () {
  await downloadImages(JSON.parse(fs.readFileSync(getAbsolutePath("img.json")).toString()));
}

const imgsPath = getAbsolutePath("imgs");

async function downloadImages (json: ImgMap) {
  const urls = Object.keys(json);
  const downloadPromises = urls.map(url => downloadImage(url));

  if (!fs.existsSync(imgsPath)) {
    fs.mkdirSync(imgsPath);
  }

  // Wait for all download promises to resolve
  const result = await Promise.all(downloadPromises);
  console.log(colors.bold("Downloaded " + colors.green(result.filter(([_, success]) => success).length.toString()) + "/" + urls.length + " items"));
}

function downloadImage (url: string) {
  return new Promise<[string, boolean]>((resolve) => {
    const fileName = path.join(imgsPath, url.replace(/^.*?([^/]*)$/, "$1"));
    if (fs.existsSync(fileName)) {
      console.log(`${fileName} existed, ignore...`);
      resolve([url, true]);
      return;
    }
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        console.log(`Failed to Download ${fileName}: ${response.statusCode}`);
        resolve([url, false]);
        return;
      }

      const fileStream = fs.createWriteStream(fileName);

      response.pipe(fileStream);
      fileStream.on("finish", () => {
        console.log(`Downloaded ${url} as ${fileName}`);
        resolve([url, true]);
      });
    }).on("error", (error) => {
      console.log(`Error downloading ${url}: ${error}`);
      resolve([url, false]);
    });
  });
}
