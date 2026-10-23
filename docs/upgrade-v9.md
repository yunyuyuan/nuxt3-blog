# 从 v8 升级到 v9

中文 | [English](#upgrade-from-v8-to-v9)

v9 有两项不兼容的改动。升级前请阅读本文，否则同步上游后构建会失败。

## 改动

**1. 框架代码移到了 `layer/` 目录。** 原来在根目录的 `app/`、`server/`、`modules/`、`i18n/`、`scripts/`、`vite-plugins/`、Tailwind 配置和 `public/sticker/` 都移到了 `layer/` 中。`layer/` 以 npm 包 `@yunyuyuan/nuxt-blog` 发布。根目录仍然是一个完整的站点：`config.ts`、`public/rebuild/` 和部署配置（Vercel、Cloudflare、Netlify、GitHub Pages、Docker）的位置都没有变。

**2. 内容改为每个条目一个 md 文件。** 条目的元数据（标题、时间、标签、是否加密等）写在 md 文件开头的 YAML frontmatter 中。`public/rebuild/json/` 中的索引改为在构建时生成，不再提交到仓库。后台提交内容时，每个条目只写一个 md 文件。

旧格式：

```text
public/rebuild/json/articles.json   # 所有文章的元数据
public/rebuild/articles/8346.md     # 正文
```

新格式（条目的 id 就是文件名）：

```markdown
---
title: Welcome to your new blog!
tags:
  - test
time: 2025-10-03T07:11:04.661Z
modifyTime: 2025-10-03T07:11:04.661Z
encrypt: false
---
正文（自定义的 Markdown 语法不变）
```

转换只改变存储格式，不改变字段的值。加密条目的元数据仍然是密文。可选字段缺失时，构建会补上默认值，页面显示不变。

## fork 用户的升级步骤

建议在本地完成同步和迁移，然后一次推送。这样部署平台不会构建到“新代码 + 旧内容”的版本。需要 Node.js 22 和 pnpm 9。

```bash
git clone https://github.com/<你的账户>/<你的仓库>.git && cd <你的仓库>
git remote add upstream https://github.com/yunyuyuan/nuxt3-blog.git
git fetch upstream
git merge upstream/master
pnpm install
pnpm local:migrate-content
git add -A && git commit -m "chore: migrate content to the v9 format"
git push
```

`pnpm local:migrate-content` 的行为：

- 把 `public/rebuild/json/*.json` 中的元数据写入对应 md 文件的 frontmatter，然后删除这些 json 文件。
- 如果某个 md 文件不在旧索引中（旧版本的站点不显示它，例如从索引中删掉、但留下了 md 文件的示例条目），脚本会列出这些文件并询问是否删除。回答 `y` 时删除它们并完成迁移；回答 `n` 时不修改任何文件。
- 如果旧索引中有条目、但没有 md 文件，脚本以空正文转换，并打印警告。
- 可以重复运行。已经是新格式的文件不会被修改。

推送之前，可以运行 `pnpm dev` 检查站点。`git status` 中应该是：md 文件被修改，`public/rebuild/json/*.json` 被删除。

如果你直接在 GitHub 上点击了 "Sync fork"，部署会失败，构建日志会提示运行迁移命令。这时站点仍然显示上一次成功部署的版本。按上面的步骤在本地运行 `git pull`、`pnpm install` 和 `pnpm local:migrate-content`，然后提交并推送即可。

**修改过框架代码的用户**：`git merge` 一般能识别文件的移动，把你的修改合并到 `layer/` 中的新位置。如果出现冲突，在 `layer/` 中的对应文件里解决。

**以后的冲突**：如果你删除了示例条目，而上游以后修改了这些示例文件，同步时会出现 modify/delete 冲突。保留删除即可：`git rm <文件>`。

## 改用 starter 模板（可选）

如果你没有修改过框架代码，可以改用 starter 模板。以后升级时只需要修改 `@yunyuyuan/nuxt-blog` 的版本号，不需要同步上游。

1. 按上面的步骤完成迁移。
2. 创建新站点：`npx giget@latest "gh:yunyuyuan/nuxt3-blog/starter#master" my-blog`。
3. 把旧仓库中的 `config.ts`、`public/rebuild/` 和你自己的静态文件（例如 `public/favicon.png`）复制到新站点中。`public/rebuild/json/` 不需要复制。
4. 把 `config.ts` 中的 `githubRepo` 改为新仓库的名字。后台通过它向仓库提交内容。
5. 推送到新仓库，在部署平台上导入新仓库，并复制原来的环境变量。

---

# Upgrade from v8 to v9

v9 has two breaking changes. Read this document before you upgrade. If you sync with upstream without these steps, the build fails.

## Changes

**1. The framework code moved to `layer/`.** `app/`, `server/`, `modules/`, `i18n/`, `scripts/`, `vite-plugins/`, the Tailwind configuration and `public/sticker/` moved from the root directory to `layer/`. `layer/` is published as the npm package `@yunyuyuan/nuxt-blog`. The root directory is still a complete site: `config.ts`, `public/rebuild/` and the deployment configuration (Vercel, Cloudflare, Netlify, GitHub Pages, Docker) did not move.

**2. The content is now one md file for each item.** The metadata of an item (title, time, tags, encryption and so on) is in YAML frontmatter at the start of its md file. The id of an item is its file name. The build generates the indexes in `public/rebuild/json/`; they are no longer committed. A commit from the admin pages writes one md file for each item.

The conversion changes only the storage format. It does not change the values of the fields. The metadata of encrypted items stays encrypted. When an optional field is missing, the build adds its default value, so the pages look the same.

## Steps for forks

Do the sync and the migration on your computer, then push once. Your platform then never builds new code with old content. You need Node.js 22 and pnpm 9.

```bash
git clone https://github.com/<your-account>/<your-repo>.git && cd <your-repo>
git remote add upstream https://github.com/yunyuyuan/nuxt3-blog.git
git fetch upstream
git merge upstream/master
pnpm install
pnpm local:migrate-content
git add -A && git commit -m "chore: migrate content to the v9 format"
git push
```

What `pnpm local:migrate-content` does:

- It writes the metadata from `public/rebuild/json/*.json` into the frontmatter of the md files, then deletes the json files.
- If an md file is not in the old index, the old site does not show it (for example, a sample item that was removed from the index but whose md file stayed). The script lists these files and asks if it can delete them. If you answer `y`, it deletes them and completes the migration. If you answer `n`, it changes nothing.
- If the old index contains an item without an md file, the script converts it with empty content and prints a warning.
- You can run it again. It does not change files that are already in the new format.

Before you push, you can run `pnpm dev` to check the site. `git status` should show modified md files and deleted `public/rebuild/json/*.json` files.

If you already clicked "Sync fork" on GitHub, the deployment fails and the build log tells you to run the migration. Your site still shows the last successful deployment. Run `git pull`, `pnpm install` and `pnpm local:migrate-content` on your computer, then commit and push.

**If you changed the framework code**: `git merge` usually detects the moved files and applies your changes to the new location in `layer/`. If there are conflicts, resolve them in the files in `layer/`.

**Later conflicts**: if you deleted the sample items and upstream changes these sample files later, the sync shows a modify/delete conflict. Keep the deletion: `git rm <file>`.

## Switch to the starter template (optional)

If you did not change the framework code, you can switch to the starter template. You then upgrade by changing the version of `@yunyuyuan/nuxt-blog`, without syncing with upstream.

1. Do the migration with the steps above.
2. Create a new site: `npx giget@latest "gh:yunyuyuan/nuxt3-blog/starter#master" my-blog`.
3. Copy `config.ts`, `public/rebuild/` and your own static files (for example `public/favicon.png`) from the old repository to the new site. Do not copy `public/rebuild/json/`.
4. Change `githubRepo` in `config.ts` to the name of the new repository. The admin pages commit to this repository.
5. Push to the new repository, import it on your platform, and copy your environment variables.
