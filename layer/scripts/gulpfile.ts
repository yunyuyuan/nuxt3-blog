import gulp from "gulp";
import chpwd from "./change-pwd";
import genFileMap from "./generate-file-map";
import subFile from "./substitute-file";
import downloadFile from "./download-file";
import { uploadAlgoliaIndex } from "./nuxt-hooks";
import { loadBlogConfig, setBlogContext } from "./utils/context";

// gulp 的工作目录是 gulpfile.js 所在的站点根目录
const ready = loadBlogConfig(process.cwd()).then(config => setBlogContext({ rootDir: process.cwd(), config }));

gulp.task("generate-file-map", async (cb) => {
  await ready;
  await genFileMap(process.env.NB_PASSWD, process.env.NB_FILE_REGEX);
  cb();
});

gulp.task("download-file", async (cb) => {
  await ready;
  // NB_FILES_DIR: optional, overrides default download directory (defaults to <project>/files)
  await downloadFile(parseInt(process.env.FILE_USER ?? ""), parseInt(process.env.FILE_GROUP ?? ""));
  cb();
});

gulp.task("substitute-file", async (cb) => {
  await ready;
  await subFile();
  cb();
});

gulp.task("change-passwd", async (cb) => {
  await ready;
  await chpwd();
  cb();
});

gulp.task("upload-algolia", async (cb) => {
  await ready;
  await uploadAlgoliaIndex();
  cb();
});
