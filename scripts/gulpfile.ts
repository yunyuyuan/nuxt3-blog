// eslint-disable-next-line import/named
import { task } from "gulp";
import chpwd from "./change-pwd";

task("chpwd", (cb) => {
  chpwd();
  cb();
});
