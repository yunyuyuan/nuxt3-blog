import fs from "fs";
import { resolve } from "path";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc.js";
import genRss from "./rss";
import { distPath } from "./constants";
import { nbLog, runCmd } from ".";

dayjs.extend(utc);

export default async function () {
  await runCmd("nuxt generate");
  generateSiteMap();
  generateTimestamp();
}

function generateSiteMap () {
  nbLog("sitemap");
  fs.writeFileSync(resolve(distPath, "sitemap.xml"),
    genRss(JSON.parse(fs.readFileSync(resolve(__dirname, "../public/rebuild/json/articles.json")).toString())));
}

function generateTimestamp () {
  nbLog("inject timestamp");
  const timestamp = dayjs.utc().add(8, "hour").format("YYYY-MM-DD HH:mm:ss");
  fs.writeFileSync(resolve(distPath, "timestamp.txt"), timestamp);
  const aboutHtmlPath = resolve(distPath, "about/index.html");
  if (fs.existsSync(aboutHtmlPath)) {
    fs.writeFileSync(
      aboutHtmlPath,
      fs.readFileSync(aboutHtmlPath, { encoding: "utf-8" })
        .toString()
        .replace("$(inject:timestamp)", timestamp),
      {
        encoding: "utf-8"
      }
    );
  }
}
