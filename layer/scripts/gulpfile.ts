import path from "path";
import gulp from "gulp";
import colors from "colors";
import chpwd from "./change-pwd";
import genFileMap from "./generate-file-map";
import subFile from "./substitute-file";
import downloadFile from "./download-file";
import { uploadAlgoliaIndex } from "./nuxt-hooks";
import { applyMigration, planMigration } from "./migrate-content";
import { getRebuildPath, promptTask } from "./utils";
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

// 内容格式迁移（JSON 索引 + md -> frontmatter + md）。NB_REBUILD_DIR 可以指定其他内容目录，例如 public/e2e/rebuild
gulp.task("migrate-content", async (cb) => {
  await ready;
  const rebuildDir = process.env.NB_REBUILD_DIR ? path.resolve(process.cwd(), process.env.NB_REBUILD_DIR) : getRebuildPath();
  const plan = planMigration(rebuildDir);
  const run = (deleteOrphans: boolean) => {
    applyMigration(plan, { deleteOrphans });
    const counts = Object.entries(plan.counts).map(([tab, n]) => `${tab.slice(1)} ${n}`).join(", ");
    console.log(colors.green(`Converted: ${counts}. Already in the new format: ${plan.alreadyMigrated}. Removed old index files: ${plan.indexFiles.length}.`));
    for (const file of plan.missingBodies) {
      console.log(colors.yellow(`No md file, converted with empty content: ${path.relative(process.cwd(), file)}`));
    }
  };
  if (!plan.orphans.length) {
    run(false);
  } else {
    console.log(colors.yellow("These md files are not in the old index, so the site does not show them:"));
    plan.orphans.forEach(f => console.log("  " + path.relative(process.cwd(), f)));
    await promptTask([{
      name: "deleteOrphans",
      type: "confirm",
      message: "The new format shows every md file. Delete these files and continue?",
      initial: false
    }], ({ deleteOrphans }) => {
      if (deleteOrphans) {
        run(true);
      } else {
        console.log(colors.red("Nothing changed."));
      }
    });
  }
  cb();
});
