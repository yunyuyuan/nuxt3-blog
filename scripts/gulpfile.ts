import gulp from "gulp";
import chpwd from "./change-pwd";
import genFileMap from "./generate-file-map";
import subFile from "./substitute-file";
import downloadFile from "./download-file";
import { uploadAlgoliaIndex } from "./nuxt-hooks";

gulp.task("generate-file-map", async (cb) => {
  await genFileMap(process.env.NB_PASSWD, process.env.NB_FILE_REGEX);
  cb();
});

gulp.task("download-file", async (cb) => {
  await downloadFile(parseInt(process.env.FILE_USER), parseInt(process.env.FILE_GROUP));
  cb();
});

gulp.task("substitute-file", async (cb) => {
  await subFile();
  cb();
});

gulp.task("change-passwd", async (cb) => {
  await chpwd();
  cb();
});

gulp.task("upload-algolia", async (cb) => {
  await uploadAlgoliaIndex();
  cb();
});
