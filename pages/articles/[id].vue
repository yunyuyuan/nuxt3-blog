<script setup lang="ts">
import useContentPage from "~/utils/public/detail";
import { ArticleItem } from "~/utils/types";
import { addScrollListener, rmScrollListener } from "~/utils/scroll-event";
import { getLocalStorage, rmLocalStorage, setLocalStorage, useComment } from "~/utils/utils";
import { inBrowser } from "~/utils/constants";

const { item, tabUrl, htmlContent, modifyTime, markdownRef, mdPending, htmlInserted } = useContentPage<ArticleItem>();

useHead({
  title: computed(() => item.title)
});

const activeAnchor = ref<string>();

const hideMenu = ref<boolean>(inBrowser && !!getLocalStorage("hideMenu"));
watch(hideMenu, (hide) => {
  if (hide) {
    setLocalStorage("hideMenu", "true");
  } else {
    rmLocalStorage("hideMenu");
  }
});

const captainEl = ref<HTMLElement>();
const menuEl = ref<HTMLElement>();
const menuOuterView = ref<boolean>(false);

const listenAnchor = () => {
  if (item.menu.length) {
    const rect = captainEl.value.getBoundingClientRect();
    menuOuterView.value = (rect.height + rect.top - 42) < menuEl.value.scrollHeight;
  }

  try {
    const links = Array.from(
      markdownRef.value?.querySelectorAll("h1>a, h2>a, h3>a, h4>a, h5>a, h6>a")
    ).reverse();
    for (const link of links) {
      if (link.getBoundingClientRect().y <= 52) {
        const hash = link.getAttribute("href");
        activeAnchor.value = item.menu.find(anchor => anchor.url === hash).url;
        return;
      }
    }
    // 未找到
    activeAnchor.value = item.menu[0].url;
  } catch {}
};

onMounted(() => {
  watch(mdPending, (pend) => {
    if (!pend) {
      const hash = useRoute().hash;
      nextTick(() => {
        if (hash) {
          watch(htmlInserted, (inserted) => {
            if (inserted) {
              window.scrollTo({
                top: document
                  .getElementById(
                    encodeURIComponent(decodeURIComponent(hash.slice(1)))
                  )
                  ?.getBoundingClientRect().y
              });
            }
          }, { immediate: true });
        } else {
          listenAnchor();
        }
        addScrollListener(listenAnchor);
      });
    }
  },
  { immediate: true }
  );
});

onBeforeUnmount(() => {
  rmScrollListener(listenAnchor);
});

const { root, hasComment } = useComment(tabUrl);
</script>

<template>
  <div ref="root" class="article-detail">
    <div ref="captainEl" class="captain flex w100" :class="{ 'no-menu': !item.menu.length, compact: hideMenu }">
      <div class="article-container">
        <h2>{{ item.title }}</h2>
        <common-loading v-if="mdPending" />
        <client-only>
          <div v-viewer class="html-container">
            <article
              v-show="!mdPending"
              ref="markdownRef"
              class="--markdown"
              v-html="htmlContent"
            />
          </div>
        </client-only>
      </div>
      <div v-if="item.menu.length" :class="{'outer-view': menuOuterView}" class="menu flexc">
        <span class="toggle flex" :title="(hideMenu ? '展开':'压缩')+'目录'" @click="hideMenu = !hideMenu">
          <svg-icon name="up" />
        </span>
        <ol ref="menuEl">
          <li v-for="(anchor, idx) in item.menu" :key="idx">
            <a
              :href="anchor.url"
              :class="[anchor.size, { active: activeAnchor === anchor.url }]"
              :title="anchor.text"
            >
              <span>{{ anchor.text }}</span>
            </a>
          </li>
        </ol>
      </div>
    </div>
    <div class="more-info flex" :class="{'has-comment': hasComment}">
      <div class="tag flex">
        <span>标签:</span>
        <the-tag
          v-for="tag in item.tags"
          :key="tag"
          :href="'/articles?tag=' + tag"
        >
          {{ tag }}
        </the-tag>
      </div>
      <span class="time">
        更新于:
        <span>{{ modifyTime }}</span>
      </span>
    </div>
  </div>
</template>

<style lang="scss">
@import "assets/style/var";

.article-detail {
  $min-article-size: 500px;
  $menu-size: 180px;
  $menu-margin: 20px;
  $compact-menu-size: 30px;
  $compact-menu-margin: 5px;
  $base-article-size: 880px;

  margin-bottom: 60px;

  .captain {
    margin: auto;
    position: relative;
    max-width: 1050px;
    min-width: $min-article-size + $menu-size + $menu-margin;

    > .article-container {
      position: relative;
      width: $base-article-size;
      min-width: $min-article-size;
      margin: 0 $menu-size + $menu-margin 0 20px;
      padding-bottom: 60px;
      border-bottom: 1px solid #c7c7c7;

      > h2 {
        margin: 30px 0 40px;
        text-align: center;
        color: #1d1d1d;
        word-break: break-word;
        letter-spacing: 0.5px;
        font-family: $font-source-han-sans;
      }

      >.common-loading {
        width: 100%;
        padding: 50px 0;
      }

      >.html-container {
        position: relative;
        z-index: 2;
      }
    }

    &.compact {
      >.article-container {
        margin-right: $compact-menu-size + $compact-menu-margin;
        width: $base-article-size + ($menu-size - $compact-menu-size);
      }

      > .menu {
        width: $compact-menu-size + $compact-menu-margin;

        >.toggle {
          >svg {
            transform: rotate(-90deg);
          }
        }

        ol {
          width: $compact-menu-size - $compact-menu-margin;
          min-width: $compact-menu-size - $compact-menu-margin;

          a {
            padding: 10px !important;

            &::before {
              left: 50% !important;
              transform: translateX(-50%);
            }

            span {
              display: none;
            }
          }
        }
      }

      ~ .more-info {
        padding-right: $compact-menu-size + $compact-menu-margin;
      }
    }

    &.no-menu {
      width: $base-article-size;

      > .article-container {
        margin: 0 auto;
      }

      ~ .more-info {
        padding-right: 0;
      }
    }

    > .menu {
      position: absolute;
      top: 0;
      right: 0;
      width: $menu-size + $menu-margin;
      align-items: flex-end;

      &.outer-view {
        bottom: 50px;
        top: unset;

        >.toggle {
          position: absolute;
        }

        ol {
          position: relative;
        }
      }

      >.toggle {
        position: fixed;
        top: $header-height + 12px;
        z-index: 2;
        cursor: pointer;

        &:hover > svg {
          fill: #333;
        }

        >svg {
          @include square(20px);

          transition: $common-transition;
          fill: #777;
          transform: rotate(90deg);
        }
      }

      ol {
        position: fixed;
        top: $header-height;
        padding: 40px 0 0 $menu-margin;
        width: $menu-size - $menu-margin;
        min-width: $menu-size - $menu-margin;
        list-style: none;
        z-index: 1;

        $mouse-out-color: #929292;
        $mouse-in-color: #6b6363;

        &:hover {
          a {
            color: $mouse-in-color;

            &::before {
              background: $mouse-in-color;
            }

            &.small {
              &::before {
                border: 1px solid $mouse-in-color;
              }
            }
          }
        }

        a {
          text-decoration: none;
          font-size: 13px;
          line-height: 18px;
          padding: 5px 5px 5px 18px;
          display: flex;
          align-items: center;
          transition: $common-transition;
          position: relative;
          color: $mouse-out-color;
          border-radius: 4px;
          word-break: break-word;
          margin-bottom: 9px;

          &::before {
            position: absolute;
            content: "";
            border-radius: 50%;

            @include square(8px);

            background: $mouse-out-color;
            left: 5px;
            flex-shrink: 0;
            transition: $common-transition;
          }

          &.small {
            font-size: 0.8em;
            padding-left: 32px;

            &::before {
              left: 16px;

              @include square(7px);

              background: transparent !important;
              border: 1px solid $mouse-out-color;
            }
          }

          &:hover {
            background: #f5f5f5;
            color: black;

            &::before {
              background: black;
              border-color: black;
            }
          }

          &.active {
            $active-color: #006fff;

            background: #e3efff;
            color: $active-color;

            &::before {
              background: $active-color;
              border-color: $active-color;
            }
          }
        }
      }
    }
  }

  .more-info {
    padding: 8px $menu-size + $menu-margin 20px 20px;
    text-align: center;
    font-size: 12px;

    div {
      flex-wrap: wrap;

      span {
        word-break: keep-all;
        margin-right: 8px;
      }

      a {
        margin: 0 8px 8px 0;

        &:not(:last-of-type) {
          margin-right: 8px;
        }
      }
    }

    > span {
      margin-left: auto;

      span {
        color: #ff6a00;
      }
    }
  }
}

@media screen and (min-width: 768px) and (max-width: 1050px) {
  .article-detail {
    width: 95vw;

    .captain {
      width: 100% !important;
      max-width: unset;
      min-width: unset;

      > .article-container {
        width: calc(100% - 120px);
        max-width: unset;
        min-width: unset;
        margin: 0 60px;
      }

      > .menu {
        display: none;

        ul {
          display: none;
        }
      }
    }

    .more-info {
      width: calc(100% - 120px);
      padding: 8px 60px 10px;

      div {
        margin-left: 8px;
      }

      > span {
        margin-right: 8px;
      }
    }
  }
}

@include mobile {
  .article-detail {
    width: 100%;

    .captain {
      width: 100% !important;
      max-width: unset;
      min-width: unset;

      > .article-container {
        width: calc(100% - 20px);
        max-width: unset;
        min-width: unset;
        margin: 0 10px;
      }

      > .menu {
        display: none;

        ul {
          display: none;
        }
      }
    }

    .more-info {
      width: 100%;
      padding: 8px 0 10px;

      div {
        margin-left: 8px;
      }

      > span {
        margin-right: 8px;
      }
    }
  }
}
</style>
