<script setup lang="ts">
import { useContentPage, useComment, initViewer, useCommonSEOTitle } from "~/utils/nuxt";
import { type KnowledgeItem } from "~/utils/common";

const { item, tabUrl, modifyTime, markdownRef, htmlContent } = await useContentPage<KnowledgeItem>();
useCommonSEOTitle(computed(() => item.title));

const { root, hasComment } = useComment(tabUrl);
initViewer(root);
</script>

<template>
  <div ref="root" class="knowledge-detail">
    <div class="captain flexc w100" :class="{'has-comment': hasComment}">
      <div class="info">
        <div class="cover">
          <the-lazy-img
            :src="item.cover"
            alt="cover"
            :container-size="['150px', '250px']"
            viewer
          />
        </div>
        <div class="text-info flexc">
          <h2>
            {{ item.title }}
            <a
              v-if="item.link && item.link.startsWith('http')"
              target="_blank"
              :href="item.link"
              :title="$t('link')"
            >
              <svg-icon name="open-link" />
            </a>
          </h2>
          <p>{{ item.summary }}</p>
        </div>
      </div>
      <div class="divider">
        <div v-if="item.type === 'game'" class="game">
          <div class="pacman">
            <span class="top" />
            <span class="bottom" />
            <span class="left" />
            <div class="eye" />
          </div>
          <span />
        </div>
        <div v-else-if="item.type === 'book'" class="book">
          <img src="~/assets/image/book-divide.png" alt="book">
          <span />
        </div>
        <div v-else class="film">
          <svg-icon name="film-roll" />
          <span />
        </div>
      </div>
      <div class="article-container">
        <article ref="markdownRef" class="--markdown" v-html="htmlContent" />
      </div>
      <span class="foot flex">
        <span v-if="Number(item.visitors) >= 0" class="visitors flex" :title="$t('visit-time', [item.visitors])">
          <svg-icon name="view" />
          {{ item.visitors }}
        </span>
        <span class="modify">
          {{ $t('updated-at') }}:
          <time>{{ modifyTime }}</time>
        </span>
      </span>
    </div>
  </div>
</template>

<style lang="scss">
.knowledge-detail {
  margin: 0 15px 80px;

  .captain {
    margin: auto;
    position: relative;
    width: 1000px;

    > .info {
      margin: 40px 0 20px;
      padding-bottom: 20px;
      position: relative;
      display: flex;
      width: 100%;

      >.cover {
        flex-shrink: 0;
        align-self: center;

        .--lazy-img {
          border: 1px solid #919191;
          box-shadow: 0 0 16px #4f4f4f;

          img {
            width: 150px;
            object-fit: contain;
          }
        }
      }

      .text-info {
        align-items: flex-start;
        flex-grow: 1;

        h2 {
          text-align: center;
          margin-bottom: 15px;
          position: relative;
          width: 100%;
          word-break: break-word;

          a {
            position: absolute;
            display: none;
            margin-left: 8px;

            svg {
              @include square(18px);

              fill: #002eff;

              @include dark-mode {
                fill: $theme-color-lighten;
              }
            }
          }

          &:hover {
            a {
              display: unset;
            }
          }
        }

        p {
          font-size: f-size(0.77);
          line-height: 24px;
          letter-spacing: 0.15px;
          padding-left: 20px;
          white-space: pre-wrap;
          color: #1b1b1b;
          word-break: break-word;

          @include dark-mode {
            color: rgb(235 235 235);
          }
        }
      }
    }

    > .divider {
      width: 100%;
      height: 0;
      overflow: visible;
      margin-bottom: 40px;

      .game {
        position: relative;

        $size: 26px;
        $duration: 0.8s;

        .pacman {
          position: absolute;
          left: 0;
          top: 0;
          transform: translateY(-50%);

          @include square($size);

          z-index: 2;

          .eye {
            position: absolute;
            top: math.div($size, 6);
            left: math.div($size, 2.8);

            @include square(4px);

            border-radius: 50%;
            background-color: #372c6c;
          }

          span {
            position: absolute;
            top: 0;
            left: 0;

            @include square($size);

            &::before {
              content: "";
              position: absolute;
              left: 0;
              height: math.div($size, 2);
              width: $size;
              background-color: #ffad4b;
            }
          }

          .top {
            animation: animtop $duration infinite;

            &::before {
              top: 0;
              border-radius: $size $size 0 0;
            }
          }

          .left::before {
            content: none;
          }

          .bottom {
            animation: animbottom $duration infinite;

            &::before {
              bottom: 0;
              border-radius: 0 0 $size $size;
            }
          }

          @keyframes animtop {
            0%,
            100% {
              transform: rotate(0deg);
            }

            50% {
              transform: rotate(-45deg);
            }
          }

          @keyframes animtop {
            0%,
            100% {
              transform: rotate(0deg);
            }

            50% {
              transform: rotate(-45deg);
            }
          }

          @keyframes animbottom {
            0%,
            100% {
              transform: rotate(0deg);
            }

            50% {
              transform: rotate(45deg);
            }
          }

          @keyframes animbottom {
            0%,
            100% {
              transform: rotate(0deg);
            }

            50% {
              transform: rotate(45deg);
            }
          }
        }

        > span {
          width: calc(100% - 20px);
          position: absolute;
          z-index: 1;
          right: 0;
          top: 0;
          transform: translateY(-50%) translateX(0);
          height: 0;
          border-top: 4px dotted #838383;
          animation: dotted-move $duration linear infinite;

          @keyframes dotted-move {
            0% {
              transform: translateY(-50%) translateX(0);
            }

            100% {
              transform: translateY(-50%) translateX(-8px);
            }
          }
        }
      }

      .book,
      .film {
        position: relative;
        width: 100%;

        img {
          width: 50px;
          position: absolute;
          right: 8px;
          bottom: 0;
        }

        span {
          position: absolute;
          bottom: 0;
          left: 0;
          display: block;
          width: 100%;
          height: 1px;
          background: black;

          @include dark-mode {
            background: rgb(206 206 206);
          }
        }
      }

      .film {
        svg {
          @include square(36px);

          position: absolute;
          right: 8px;
          bottom: 0;
          animation: rotate 5s linear infinite;
          fill: black;

          @include dark-mode {
            fill: $theme-color-lighten;
          }

          @keyframes rotate {
            0% {
              transform: rotate(0);
            }

            100% {
              transform: rotate(360deg);
            }
          }
        }

        span {
          width: calc(100% - 30px);
        }
      }
    }

    > .article-container {
      width: 800px;
    }

    > .foot {
      margin-left: auto;
      margin-top: 40px;

      .modify {
        font-size: f-size(0.75);
        color: #f80;
      }

      .visitors {
        padding-right: 15px;
        margin-right: 15px;
        font-size: f-size(0.75);
        color: rgb(54 54 54);
        border-right: 1px solid rgb(172 172 172);

        @include dark-mode {
          color: rgb(221 221 221);

          svg {
            fill: rgb(221 221 221);
          }
        }

        svg {
          margin-right: 5px;
          fill: rgb(54 54 54);

          @include square(15px);
        }
      }
    }
  }
}

@include mobile {
  .knowledge-detail {
    width: 100%;
    margin: 0 0 80px;

    .captain {
      width: calc(100% - 20px) !important;
      max-width: unset;
      min-width: unset;

      > .info {
        flex-direction: column;

        >.cover {
          margin-bottom: 30px;
          width: 60%;

          .--lazy-img {
            img {
              width: 100%;
            }
          }
        }

        .text-info {
          h2 {
            a {
              display: unset;
              position: relative;
              top: 0;
              left: 0;
              margin-left: 0;
            }
          }

          p {
            padding-left: 0;
          }
        }
      }

      > .article-container {
        width: 100%;
      }
    }
  }
}
</style>
