<script setup lang="ts">
import { ArticleItem } from "~/utils/types";
import { literalTime, formatTime } from "~/utils/_dayjs";
import useListPage from "~/utils/public/list";

const { list: articlesList, pending } = useListPage<ArticleItem>();

const articleTagList = new Set<string>();

watch(articlesList, () => {
  articlesList.forEach((item) => {
    item.tags.forEach(v => articleTagList.add(v));
  });
}, { immediate: true });

const tags = computed<string[]>(() => {
  try {
    const tags = useRoute().query.tag as string;
    return tags ? (tags.split(",") as string[]) : [];
  } catch (e) {
    return [];
  }
});

const filteredList = computed(() => {
  return articlesList.filter(item =>
    tags.value.every(tag => item.tags.includes(tag))
  );
});

const toggleTags = (tag: string) => {
  const newTags = tags.value.slice();
  const searchIdx = newTags.indexOf(tag);
  if (searchIdx > -1) {
    newTags.splice(searchIdx, 1);
  } else {
    newTags.push(tag);
  }
  navigateTo({ query: { tag: newTags.join(",") } }, { replace: true });
};
</script>

<template>
  <div class="article-list flexc">
    <div class="head flex">
      <div class="tags flex">
        <the-tag
          v-for="tag in articleTagList"
          :key="tag"
          :active="tags.includes(tag)"
          @click="toggleTags(tag)"
        >
          {{ tag }}
        </the-tag>
      </div>
      <span class="num">
        <b>{{ filteredList.filter((i) => i._show).length }}</b>篇
      </span>
    </div>
    <div class="body flexc">
      <common-loading v-if="pending" />
      <ul class="w100">
        <li v-for="item in filteredList" v-show="item._show" :key="item.id">
          <nuxt-link :to="'/articles/' + String(item.id)">
            <b>{{ item.title }}</b>
            <div class="foot flex">
              <span :title="formatTime(item.time)">{{
                literalTime(item.time)
              }}</span>
              <b />
              <span>{{ item.len }}字</span>
            </div>
          </nuxt-link>
        </li>
      </ul>
    </div>
  </div>
</template>

<style lang="scss">
@use "sass:math";
@import "assets/style/var";

$space: 13px;

.article-list {
  width: 800px;
  margin: 0 auto 40px 0;
  align-items: flex-start;

  .head {
    margin: $space * 2;
    align-self: stretch;

    .tags {
      flex-wrap: wrap;

      .common-tag {
        margin: 0 10px 10px 0;
      }
    }

    .num {
      font-size: 12px;
      margin-left: auto;

      b {
        margin-right: 3px;
        color: #ff8100;
      }
    }
  }

  .body {
    $footer-color: #7c7c7c;
    $footer-hover: black;

    align-self: stretch;
    margin: 0 20px;

    .common-loading {
      margin-top: calc(50vh - $header-height);
      transform: translateY(-100%);
    }

    ul {
      list-style: none;

      li {
        &.hide {
          display: none;
        }

        &:not(:last-of-type) {
          margin-bottom: $space * 1.6;
        }

        &:hover {
          > a {
            b {
              text-decoration: underline;
            }

            .foot {
              color: $footer-hover;

              b {
                background: $footer-hover;
              }
            }
          }
        }

        > a {
          transition: $common-transition;
          display: block;
          text-decoration: none;
          border-bottom: 1px solid #f3f3f3;
          padding: $space * 0.8 0 $space * 1.4 $space * 0.8;

          &:active b {
            text-decoration: underline;
          }

          b {
            color: $theme-color-darken;
            font-size: 17px;
            min-height: 20px;
            line-height: 20px;
            display: block;
            transition: $common-transition;
            word-break: break-word;
            font-family: $font-source-han-sans;
            letter-spacing: 0.2px;
          }

          .foot {
            margin-top: math.div($space, 1.5);
            font-size: 13px;
            color: $footer-color;
            transition: $common-transition;
            height: 18px;

            b {
              height: 60%;
              margin: 0 8px;
              width: 1px;
              background: $footer-color;
            }
          }
        }
      }
    }
  }
}

@include mobile {
  .article-list {
    width: 100%;

    .head,
    .body {
      margin-left: 10px;
      margin-right: 10px;
    }
  }
}
</style>
