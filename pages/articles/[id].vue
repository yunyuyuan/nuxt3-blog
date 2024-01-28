<script setup lang="ts">
import { addScrollListener, rmScrollListener, type ArticleItem } from "~/utils/common";
import { getLocalStorage, rmLocalStorage, setLocalStorage, initViewer, isPrerender, useContentPage, useComment, watchUntil, useCommonSEOTitle } from "~/utils/nuxt";

const { item, tabUrl, modifyTime, menuItems, htmlContent, markdownRef, htmlInserted } = await useContentPage<ArticleItem>();
useCommonSEOTitle(computed(() => item.title), computed(() => item.tags));
const activeAnchor = ref<string>();

const hideMenu = ref(!!getLocalStorage("hideMenu"));
watch(hideMenu, (hide) => {
  if (hide) {
    setLocalStorage("hideMenu", "true");
  } else {
    rmLocalStorage("hideMenu");
  }
});

const listenAnchor = () => {
  try {
    const links = Array.from(markdownRef.value!.querySelectorAll<HTMLLinkElement>("h1>a, h2>a, h3>a, h4>a, h5>a, h6>a")).reverse();
    for (const link of links) {
      if (link.getBoundingClientRect().y <= 52) {
        const hash = link.getAttribute("href");
        activeAnchor.value = menuItems.value.find(anchor => anchor.url === hash?.slice(1))?.url;
        return;
      }
    }
    // 未找到
    activeAnchor.value = menuItems.value[0]?.url;
  } catch {}
};

if (!isPrerender) {
  onMounted(() => {
    const hash = useRoute().hash;
    nextTick(() => {
      if (hash) {
        watchUntil(htmlInserted, () => {
          window.scrollTo({
            top: document
              .getElementById(hash.slice(1))
              ?.getBoundingClientRect().y
          });
        }, { immediate: true }, "boolean", "cancelAfterUntil");
      } else {
        listenAnchor();
      }
      addScrollListener(listenAnchor);
    });
  });
}

onBeforeUnmount(() => {
  rmScrollListener(listenAnchor);
});

const { root, hasComment } = useComment(tabUrl);
initViewer(root);
</script>

<template>
  <div ref="root" class="article-detail">
    <div class="captain w100" :class="{'has-comment': hasComment}">
      <div class="article-container">
        <h1>{{ item.title }}</h1>
        <div ref="viewerContainer" class="html-container">
          <article
            ref="markdownRef"
            class="--markdown"
            v-html="htmlContent"
          />
        </div>
        <div class="more-info flex">
          <div class="tags flex">
            <span>{{ $t('tags') }}:</span>
            <the-tag
              v-for="tag in item.tags"
              :key="tag"
              :href="'/articles?tag=' + tag"
            >
              {{ tag }}
            </the-tag>
          </div>
          <span class="time">
            {{ $t('updated-at') }}:
            <span>{{ modifyTime }}</span>
          </span>
          <span v-if="Number(item.visitors) >= 0" class="visitors flex" :title="$t('visit-time', [item.visitors])">
            <svg-icon name="view" />
            {{ item.visitors }}
          </span>
        </div>
      </div>
      <div v-if="menuItems.length" class="menu flexc" :class="{compact: hideMenu}">
        <span class="toggle flex" :title="$t((hideMenu ? 'unfold':'fold')+'-menu')" @click="hideMenu = !hideMenu">
          <svg-icon name="up" />
        </span>
        <ol>
          <li v-for="(anchor, idx) in menuItems" :key="idx">
            <a
              :href="'#'+anchor.url"
              :class="[anchor.size, { active: activeAnchor === anchor.url }]"
              :title="anchor.text"
            >
              <span v-html="anchor.text" />
            </a>
          </li>
        </ol>
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.article-detail {
  margin-bottom: 60px;

  .captain {
    display: flex;
    align-items: flex-start;
    margin: auto;

    > .article-container {
      flex-grow: 1;
      position: relative;
      margin: 0 0 0 20px;
      width: 900px;
      max-width: 900px;
      min-width: 900px;

      > h1 {
        margin: 30px 0 40px;
        text-align: center;
        color: #1d1d1d;
        word-break: break-word;
        letter-spacing: 0.5px;
        font-size: f-size(1.4);

        @include dark-mode {
          color: white;
        }
      }

      >.common-loading {
        width: 100%;
        padding: 50px 0;
      }

      >.html-container {
        position: relative;
        z-index: 2;
      }

      >.more-info {
        position: relative;
        margin-top: 30px;
        border-top: 1px solid #c7c7c7;

        @include dark-mode {
          border-color: rgb(190 190 190);
        }

        padding: 20px 0 0;
        text-align: center;
        font-size: f-size(0.75);

        .tags {
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

        > .time {
          margin-left: auto;

          span {
            color: #ff6a00;
          }
        }

        .visitors {
          position: absolute;
          right: 0;
          top: 0;
          background: $background;
          padding: 0 10px;
          transform: translateY(-50%);
          margin-right: 8px;

          @include dark-mode {
            background: $background-dark;

            svg {
              fill: white;
            }
          }

          svg {
            margin-right: 5px;

            @include square(15px);
          }
        }
      }
    }

    > .menu {
      position: sticky;
      top: $header-height;
      align-items: flex-end;
      padding: 15px 0 55px;
      margin-left: 36px;

      // @at-root #default-layout #header:not(.headroom--pinned).headroom--not-top + #body & {
      //   top: 0;
      // }

      >.toggle {
        cursor: pointer;

        &:hover > svg {
          fill: #333;

          @include dark-mode {
            fill: rgb(247 247 247);
          }
        }

        >svg {
          @include square(20px);

          transition: $common-transition;
          fill: #777;

          @include dark-mode {
            fill: rgb(209 209 209);
          }

          transform: rotate(90deg);
        }
      }

      ol {
        padding: 20px 0 0 5px;
        width: 160px;
        list-style: none;

        $mouse-out-color: #777;
        $mouse-in-color: #4d4646;
        $mouse-out-color-dark: rgb(226 226 226);
        $mouse-in-color-dark: #fff;

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

            @include dark-mode {
              color: $mouse-in-color-dark;

              &::before {
                background: $mouse-in-color-dark;
              }
            }
          }
        }

        a {
          text-decoration: none;
          padding: 5px 5px 5px 18px;
          display: flex;
          align-items: center;
          transition: $common-transition;
          position: relative;
          color: $mouse-out-color;
          border-radius: 4px;
          word-break: break-all;
          margin-bottom: 9px;

          span {
            @include textoverflow(1);

            white-space: nowrap;
            line-height: f-size(1.2);
            font-size: f-size(0.85);
          }

          @include dark-mode {
            color: $mouse-out-color-dark;
          }

          &::before {
            position: absolute;
            content: "";
            border-radius: 50%;

            @include square(8px);

            background: $mouse-out-color;

            @include dark-mode {
              background: $mouse-out-color-dark;
            }

            left: 5px;
            flex-shrink: 0;
            transition: $common-transition;
          }

          &.small {
            span {
              font-size: f-size(0.8);
            }

            padding-left: 32px;

            &::before {
              left: 16px;

              @include square(7px);

              background: transparent !important;
              border: 1px solid $mouse-out-color;

              @include dark-mode {
                border-color: $mouse-out-color-dark;
              }
            }
          }

          &:hover {
            background: #f5f5f5;
            color: black;

            @include dark-mode {
              background: #2c2c2c;
              color: white;

              &::before {
                background: white;
                border-color: white;
              }
            }

            &::before {
              background: black;
              border-color: black;
            }
          }

          &.active {
            $active-color: #006fff;
            $active-color-dark: rgb(255 255 255);

            background: #e3efff;
            color: $active-color;

            @include dark-mode {
              color: $active-color-dark;
              background: rgb(24 24 24);

              &::before {
                background: $active-color-dark;
                border-color: $active-color-dark;
              }
            }

            &::before {
              background: $active-color;
              border-color: $active-color;
            }
          }
        }
      }

      &.compact {
        >.toggle {
          >svg {
            transform: rotate(-90deg);
          }
        }

        ol {
          width: 30px;

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
      }
    }

    .more-info {
      width: 100%;
      padding: 8px 60px 10px;

      .tags {
        margin-left: 8px;
      }

      .time {
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

      .tags {
        margin-left: 8px;
      }

      .time {
        margin-right: 8px;
      }
    }
  }
}
</style>
