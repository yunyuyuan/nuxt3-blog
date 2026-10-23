# nuxt3-blog

A blog framework as a [Nuxt layer](https://nuxt.com/docs/getting-started/layers): articles, records and knowledge items, an admin UI that commits to GitHub, encryption, comments, visitor counts, search, RSS and sitemap.

Repository and documentation: https://github.com/yunyuyuan/nuxt3-blog

## Create a site

Start from the starter template:

```bash
npx giget@latest "gh:yunyuyuan/nuxt3-blog/starter#master" my-blog
cd my-blog
pnpm install
pnpm dev
```

The starter contains the files of your site only:

- `nuxt.config.ts` with `extends: ["nuxt3-blog"]`
- `config.ts`, the site configuration
- `public/rebuild/{articles,records,knowledges}/<id>.md`, the content: one file for each item, with the metadata in YAML frontmatter
- `gulpfile.js`, which loads the local scripts (`pnpm local:*`) of this package

## Requirements

- Node.js 22 or later
- Nuxt 4.4.7 or a later 4.x version
- pnpm: set `shamefully-hoist=true` (or `node-linker=hoisted`) in `.npmrc`. The build resolves dependencies of this package (for example shiki and katex) from the root of the site. npm installs packages flat by default.

## Your nuxt.config.ts

Put Vite options for the server build in `vite.$server`, not in `vite`. For example, if `vite.ssr` is set, Nuxt also clears `vite.optimizeDeps.include` of the client build. The dev server then does not pre-bundle the CommonJS dependencies of this package, and the browser fails to load them.

## Upgrade

Major versions can change the content format or the configuration. Read the [CHANGELOG](https://github.com/yunyuyuan/nuxt3-blog/blob/master/CHANGELOG.md), then:

```bash
pnpm add nuxt3-blog@^<new major version>
```

## License

MIT
