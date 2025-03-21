import gulp from "gulp";
import chpwd from "./change-pwd";
import genImgMap from "./generate-img-map";
import subImg from "./substitute-img";
import downloadImg from "./download-img";
import { uploadAlgoliaIndex } from "./generate";

gulp.task("generate-image-map", async (cb) => {
  await genImgMap(process.env.NB_PASSWD, process.env.NB_IMG_REGEX);
  cb();
});

gulp.task("download-image", async (cb) => {
  await downloadImg(parseInt(process.env.FILE_USER), parseInt(process.env.FILE_GROUP));
  cb();
});

gulp.task("substitute-image", async (cb) => {
  await subImg();
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
