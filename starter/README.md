# My Blog

中文 | [English](#english)

这个站点基于 [nuxt3-blog](https://github.com/yunyuyuan/nuxt3-blog)。框架代码在 npm 包 `nuxt3-blog` 中，本仓库只放站点自己的文件。

## 创建站点

```bash
npx giget@latest "gh:yunyuyuan/nuxt3-blog/starter#master" my-blog
cd my-blog
pnpm install
```

需要 Node.js 22 和 pnpm 9。不要删除 `.npmrc` 中的 `shamefully-hoist=true`：框架的依赖（例如 shiki、katex）在构建时从站点根目录解析。

然后：

1. 修改 `config.ts`。`githubName` 必须修改。
2. 在 GitHub 上新建一个仓库，把本目录推送上去。
3. 在部署平台（Vercel、Cloudflare Pages、Netlify、GitHub Pages 或 Docker）上导入这个仓库。环境变量见 `env.sample`，详细步骤见 [wiki](https://github.com/yunyuyuan/nuxt3-blog/wiki)。

## 文件

| 路径 | 内容 |
| --- | --- |
| `config.ts` | 站点配置 |
| `public/rebuild/articles/`、`records/`、`knowledges/` | 内容。每个条目一个 `<id>.md` 文件，元数据写在文件开头的 YAML frontmatter 中 |
| `public/` 中的其他文件 | 图标、`robots.txt` 等静态文件 |
| `nuxt.config.ts` | `extends: ["nuxt3-blog"]` |

`public/rebuild/json/` 中的索引在构建时生成，不提交到仓库。示例条目可以删除。

在 `nuxt.config.ts` 中添加只用于服务端构建的 Vite 配置时，写在 `vite.$server` 中，不要直接写 `vite.ssr`。如果设置了 `vite.ssr`，Nuxt 会同时清空客户端的 `vite.optimizeDeps.include`，开发模式下浏览器会加载框架的依赖失败。

后台管理页面在 `/manage`。在后台提交内容时，每个条目只写一个 md 文件。

## 本地命令

| 命令 | 作用 |
| --- | --- |
| `pnpm dev` | 开发服务器。在开发模式下，后台的提交直接写入本地文件 |
| `pnpm build` | 构建 |
| `pnpm local:change-pwd` | 修改加密内容的密码 |
| `pnpm local:generate-file-map`、`local:download-file`、`local:substitute-file` | 备份和替换内容中的图片 |
| `pnpm local:upload-algolia` | 上传搜索索引 |
| `pnpm local:migrate-content` | 把旧格式的内容（JSON 索引 + md）转换为 frontmatter 格式 |

## 升级

后台检测到新的主版本时会显示升级提示。升级前先阅读 [CHANGELOG](https://github.com/yunyuyuan/nuxt3-blog/blob/master/CHANGELOG.md)，然后运行：

```bash
pnpm add nuxt3-blog@^<新的主版本号>
```

提交 `package.json` 和 `pnpm-lock.yaml`，部署平台会重新构建。

---

## English

This site uses [nuxt3-blog](https://github.com/yunyuyuan/nuxt3-blog). The framework is the npm package `nuxt3-blog`. This repository contains only the files of your site.

### Create the site

```bash
npx giget@latest "gh:yunyuyuan/nuxt3-blog/starter#master" my-blog
cd my-blog
pnpm install
```

You need Node.js 22 and pnpm 9. Keep `shamefully-hoist=true` in `.npmrc`: the build resolves dependencies of the framework (for example shiki and katex) from the root of the site.

Then:

1. Edit `config.ts`. You must change `githubName`.
2. Create a GitHub repository and push this directory to it.
3. Import the repository on your platform (Vercel, Cloudflare Pages, Netlify, GitHub Pages or Docker). See `env.sample` for the environment variables and the [wiki](https://github.com/yunyuyuan/nuxt3-blog/wiki) for the steps.

### Files

| Path | Content |
| --- | --- |
| `config.ts` | Site configuration |
| `public/rebuild/articles/`, `records/`, `knowledges/` | Content. One `<id>.md` file for each item, with the metadata in YAML frontmatter at the start of the file |
| Other files in `public/` | Icons, `robots.txt` and other static files |
| `nuxt.config.ts` | `extends: ["nuxt3-blog"]` |

The build generates the indexes in `public/rebuild/json/`. Do not commit them. You can delete the sample items.

Put Vite options for the server build in `vite.$server` in `nuxt.config.ts`, not in `vite.ssr`. If `vite.ssr` is set, Nuxt also clears `vite.optimizeDeps.include` of the client build, and in development mode the browser fails to load dependencies of the framework.

The admin pages are at `/manage`. A commit from the admin pages writes one md file for each item.

### Local commands

| Command | Purpose |
| --- | --- |
| `pnpm dev` | Development server. In development mode, commits from the admin pages write to the local files |
| `pnpm build` | Build |
| `pnpm local:change-pwd` | Change the password of encrypted content |
| `pnpm local:generate-file-map`, `local:download-file`, `local:substitute-file` | Back up and replace the images in your content |
| `pnpm local:upload-algolia` | Upload the search index |
| `pnpm local:migrate-content` | Convert content in the old format (JSON index + md) to the frontmatter format |

### Upgrade

The admin pages show a message when a new major version is available. Read the [CHANGELOG](https://github.com/yunyuyuan/nuxt3-blog/blob/master/CHANGELOG.md) first, then run:

```bash
pnpm add nuxt3-blog@^<new major version>
```

Commit `package.json` and `pnpm-lock.yaml`. Your platform then rebuilds the site.
