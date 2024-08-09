import fs from "fs";
import path from "path";
import { genRss, getRebuildPath, nbLog } from "./utils";

export function generateSiteMap (publicDir: string) {
  nbLog("sitemap");
  fs.writeFileSync(path.resolve(publicDir, "sitemap.xml"),
    genRss(JSON.parse(fs.readFileSync(getRebuildPath("json", "articles.json")).toString())));
}
