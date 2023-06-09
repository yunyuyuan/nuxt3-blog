const fs = require("fs");
const path = require("path");
const https = require("https");

export type ImgMap = Record<string, {
  newUrl: string,
  appearIn: string[]
}>

export default async function () {
  await downloadImages(JSON.parse(fs.readFileSync("img.json").toString()));
}

function downloadImages (json: ImgMap) {
  const urls = Object.keys(json);
  const downloadPromises = urls.map(url => downloadImage(url));

  if (!fs.existsSync("imgs")) {
    fs.mkdirSync("imgs");
  }

  // Wait for all download promises to resolve
  return Promise.all(downloadPromises);
}

function downloadImage (url: string) {
  return new Promise<[string, boolean]>((resolve) => {
    const fileName = path.join("imgs", url.replace(/^.*?([^/]*)$/, "$1"));
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
