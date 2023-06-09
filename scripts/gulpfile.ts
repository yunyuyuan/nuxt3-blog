import gulp from "gulp";
import chpwd from "./change-pwd";
import generate from "./generate";
import genImgMap from "./generate-img-map";
import subImg from "./substitute-img";

gulp.task("generate-image-map", async (cb) => {
  await genImgMap();
  cb();
});

gulp.task("substitute-image", (cb) => {
  subImg();
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
