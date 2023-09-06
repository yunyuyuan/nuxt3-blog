import fs from "fs";
import path from "path";
import { getNowDayjsString } from "../utils/common";
import { genRss, getRebuildPath, nbLog } from "./utils";

export function generateSiteMap (publicDir: string) {
  nbLog("sitemap");
  fs.writeFileSync(path.resolve(publicDir, "sitemap.xml"),
    genRss(JSON.parse(fs.readFileSync(getRebuildPath("json", "articles.json")).toString())));
}

export function generateTimestamp (publicDir) {
  nbLog("inject timestamp");
  const timestamp = getNowDayjsString();
  fs.writeFileSync(path.resolve(publicDir, "timestamp.txt"), timestamp);
  const aboutHtmlPath = path.resolve(publicDir, "about", "index.html");
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
