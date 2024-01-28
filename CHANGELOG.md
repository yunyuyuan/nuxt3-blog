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