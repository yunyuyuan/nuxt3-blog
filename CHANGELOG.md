## [v2] 2025.10.03
* Add upgrade notifications and tutorials for forks.

## [v1] 2025.10.03
* Official `v1` release.
* Add support for "stage" and remove drafting.
* Show a final diff preview before committing.
* Clear `/public/rebuild`; new forks include only sample data.
* Upgrade to `nuxt4`.

---

## 2025.04.13
* Add 小黑盒 cube stickers.

## 2025.03.22
* Add Algolia search.
* Support random theme color.

## 2025.03.16
* Migrate mongodb atlas to cloudflare D1.

## 2025.03.09
* Add [mermaid](https://mermaid.js.org/) markdown syntax.

## 2025.03.08
* Migrate to tailwindcss, remove SASS.

## 2025.03.02
* Refactor hooks.
* Add testing.

## 2025.02.15
* Update all npm packages.

## 2024.07.23
* Add **text-with-mask** markdown syntax.

## 2024.07.05
* Make the items control comments appear individually.

## 2024.04.07
* Use `Array.some` instead of `Array.every` for articles tag filtering.

## 2024.01.28
* Update nuxt to `3.9` to fix Cloudflare Pages development.

## 2023.11.21
* Add Microsoft [Clarity](https://clarity.microsoft.com/) analytics.

## 2023.09.13
* Add Drone cronjob for backup img.

## 2023.09.09
* Add [Drone](https://drone.io) CI/CD support.

## 2023.09.06
* Use `/server` to handle api request.
* No longer use `useAsyncData`.
* Update nuxt to `3.7`.

## 2023.08.20
* Use `useAsyncData` for a better page initialization experience.

## 2023.08.11
* Update nuxt to `3.6`.
* Remove `@nuxtjs/i18n`, use a series of simple functions to achieve i18n functionality.

## 2023.06.14
* Add `katex` for mathematic formula markdown syntax.

## 2023.06.10
* Use package `prompts` instead of `prompt` for better experience.
* `/scripts` refactor.

## 2023.06.09
* Fix `npm run chpwd` (change password) not working for block-level.
* Add `npm run genimg` for generating img map.
* Add `npm run subimg` for substituting img.
* Add `npm run downimg` for downloading img.

## 2023.03.23
* Folder refactoring

## 2023.03.22
* Add timezone property in `config.ts`(Problem caused: The time of old content will be formatted as 8 hours later than really time).

## 2023.03.20
* Url prefix for i18n.
* Enhance common-dropdown animation handling.
* Bump to Nuxt@3.3.1 (for `useSeoMeta`)

## 2023.03.19
* Add **video/audio** markdown syntax.

## 2023.03.18
* Fix some type errors.

## 2023.03.17
* Use `marked.js` instead of `showdown.js` as markdown parser.
* Fix block-encryption bug.
* Add **container-block** markdown syntax.
* Add `/manage/all-svg` to show all icon svg, and `/manage/md-ref` to show markdown reference.

## 2023.03.14
* Add `i18n` support.
* Dropdown menu in mobile browser.