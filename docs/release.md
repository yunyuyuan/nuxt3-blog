# 发布 npm 包 `@yunyuyuan/nuxt-blog`（维护者）

维护者在本地运行 `pnpm release`，把 `layer/` 发布为 npm 包 `@yunyuyuan/nuxt-blog`。仓库中没有自动发布的 workflow。脚本是 `scripts/release.mjs`。

## 准备（只需要做一次）

1. 安装 Node.js 22 或更高版本和 pnpm 9。
2. 为 npm 账号 `yunyuyuan` 开启双重验证：在 npmjs.com 上点头像 → Account → Two-Factor Authentication → Enable 2FA，然后添加一个 security key。npm 要求账号开启双重验证才能发布。没有开启时，发布返回 E403。
3. 用 npm 账号 `yunyuyuan` 登录官方 registry：

   ```bash
   npm login --registry https://registry.npmjs.org/
   ```

   脚本固定使用 `https://registry.npmjs.org/`。如果本地的 npm 配置了镜像（例如 npmmirror），也不影响发布，但登录时必须加上这个 `--registry`。
   登录得到的会话 2 小时后过期，过期后需要重新登录。

## 每次发布

1. 把改动合并到 `master`，并等待 GitHub Actions 中的 Check 通过（`check`、`starter`、`e2e` 三个 job）。
2. 如果主版本号变化（例如从 9 升到 10），先在 PR 中改两个文件，并合并到 `master`：
   - 在 `CHANGELOG.md` 的顶部加入 `## [v10]` 条目。
   - 把 `starter/package.json` 中 `@yunyuyuan/nuxt-blog` 的版本范围改为 `^10.0.0`。
3. 在本地的 `master` 上先预览，再发布：

   ```bash
   git checkout master
   git pull
   pnpm release patch --dry-run
   pnpm release patch
   ```

4. 脚本打印要发布的包、版本、commit 和 tag 后，输入版本号确认。
5. npm 打印 `Authenticate your account at:` 和一个网址。在浏览器中打开这个网址，用 security key 完成验证，npm 才会发布。

必须在交互式终端中运行 `pnpm release`。不要把输出接到管道或重定向到文件，例如 `pnpm release | tee release.log`。因为 npm 只在标准输入和标准输出都是终端时才发起双重验证，否则发布会失败。

版本参数有三种写法：

| 写法 | 效果 |
|---|---|
| 不写 | 发布 `layer/package.json` 中的当前版本，不提交新 commit。只在这个版本还没有发布过时有效，例如上次在验证前中止。 |
| `patch`、`minor`、`major` | 按规则递增版本号，例如 9.0.0 → 9.0.1、9.1.0、10.0.0。 |
| `x.y.z` | 使用指定的版本号。 |

选项：

| 选项 | 效果 |
|---|---|
| `--dry-run` | 只做检查、打包和预览。不修改文件，不发布，不推送。 |
| `--skip-ci` | 不检查 GitHub 上这个 commit 的 CI 结果。只在无法访问 `api.github.com` 时使用。 |
| `--remote <name>` | 上游仓库的 remote 名称，默认为 `origin`。 |

## 已发布的版本

9.0.0 于 2026-10-23 发布，tag 是 `v9.0.0`，commit 是 `f11953d`。

## 脚本做的事

| 阶段 | 内容 |
|---|---|
| 检查 git | 当前分支是 `master`；工作区没有未提交的改动；remote 指向 `yunyuyuan/nuxt-blog`；本地 `master` 与远程一致。 |
| 检查 npm | 已经登录；包已存在时，当前账号是它的维护者。 |
| 检查版本号 | 版本号格式是 `x.y.z`，高于 npm 上的最新版本，还没有发布过；本地和远程都没有对应的 tag；`CHANGELOG.md` 中第一个 `## [vN]` 与新版本的主版本号一致；`starter/package.json` 的版本范围包含新版本。 |
| 检查 CI | 通过 GitHub 的公开 API 确认这个 commit 的 `check`、`starter`、`e2e` 都已通过。不需要登录 GitHub。 |
| 打包和预览 | 用 `pnpm pack` 打包 `layer/`，再用 `npm publish --dry-run` 显示包中的文件。 |
| 发布 | 输入版本号确认后，发布刚才预览过的同一个 tarball。npm 要求在浏览器中完成双重验证。 |
| 发布后 | 如果版本号有变化，提交 `chore(release): v<版本号>`（只包含 `layer/package.json`）；打附注 tag `v<版本号>`；把 `master` 和 tag 一起推送到远程。 |

任何一项检查失败，脚本都会在发布之前中止。如果在发布之前取消或失败，脚本会恢复 `layer/package.json`，工作区回到运行前的状态。如果 npm 已经发布成功，但提交或推送失败，脚本会列出已完成的步骤和需要手动运行的命令。

## 注意事项

- npm 在发布后扫描新版本，扫描完成后才能安装。通常要几分钟，9.0.0 用了约 2 分钟。这期间 `npm view` 和 `pnpm install` 可能还看不到新版本。
- 首次发布时，npm 先创建了一个占位版本 `0.0.0-stage`。它留在版本列表中，`latest` 指向 9.0.0，所以不影响安装。
- 同一个版本号在 npm 上只能使用一次，删除后也不能重新发布。发布错的版本时，只能再发布一个新版本。
- 后台的升级提示读取 `master` 上 `CHANGELOG.md` 中的第一个 `## [vN]`，并与站点安装的主版本号比较。所以新的主版本条目合并到 `master` 后，npm 用户马上就会看到升级提示。如果这时新版本还没有发布，用户按提示升级会失败。新主版本的 CHANGELOG 合并后，请尽快发布。
- CI 中的 `starter` job 把 `layer/` 打包，然后用这个包安装和构建 starter。这个 job 通过，说明 npm 包可以独立使用。脚本要求这个 job 在要发布的 commit 上已经通过。
