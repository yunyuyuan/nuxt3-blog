import fs from "fs";
import { getNowDayjsString } from "../utils/common";
import { genRss, getDistPath, getRebuildPath, nbLog } from "./utils";

export function generateSiteMap () {
  nbLog("sitemap");
  fs.writeFileSync(getDistPath("sitemap.xml"),
    genRss(JSON.parse(fs.readFileSync(getRebuildPath("json", "articles.json")).toString())));
}

export function generateTimestamp () {
  nbLog("inject timestamp");
  const timestamp = getNowDayjsString();
  fs.writeFileSync(getDistPath("timestamp.txt"), timestamp);
  const aboutHtmlPath = getDistPath("about", "index.html");
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
