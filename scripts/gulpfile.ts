import gulp from "gulp";
import chpwd from "./change-pwd";
import generate from "./generate";

gulp.task("chpwd", (cb) => {
  chpwd();
  cb();
});

gulp.task("generate", async (cb) => {
  await generate();
  cb();
});
