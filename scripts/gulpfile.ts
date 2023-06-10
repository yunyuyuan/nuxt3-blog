import gulp from "gulp";
import chpwd from "./change-pwd";
import generate from "./generate";
import genImgMap from "./generate-img-map";
import subImg from "./substitute-img";
import downloadImg from "./download-img";

gulp.task("generate-image-map", async (cb) => {
  await genImgMap();
  cb();
});

gulp.task("download-image", async (cb) => {
  await downloadImg();
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

gulp.task("generate", async (cb) => {
  await generate();
  cb();
});
