<script setup lang="ts">
import { type ArticleItem } from "~/utils/common";
import { formatTime, literalTime, useListPage } from "~/utils/nuxt";

definePageMeta({
  alias: "/"
});

const articlesList = await useListPage<ArticleItem>();

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
        <b>{{ filteredList.filter((i) => i._show).length }}</b>{{ $t('articles-num') }}
      </span>
    </div>
    <div class="body flexc">
      <ul v-if="filteredList.length" class="w100">
        <li v-for="item in filteredList" v-show="item._show" :key="item.id">
          <nuxt-link no-prefetch :to="'/articles/' + String(item.id)">
            <b>{{ item.title }}</b>
            <div class="foot flex">
              <span :title="formatTime(item.time)">{{
                literalTime(item.time)
              }}</span>
              <b />
              <span>{{ item.len }} {{ $t('words-num') }}</span>
              <span v-if="Number(item.visitors) >= 0" class="visitors flex" :title="$t('visit-time', [item.visitors])">
                <svg-icon name="view" />
                {{ item.visitors }}
              </span>
            </div>
          </nuxt-link>
        </li>
      </ul>
      <div v-else class="empty">
        {{ $T('nothing-here') }}
      </div>
    </div>
  </div>
</template>

<style lang="scss">
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
      font-size: f-size(0.77);
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
    $footer-color-dark: rgb(218 218 218);
    $footer-hover-dark: rgb(253 253 253);

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

              .visitors {
                svg {
                  fill: $footer-hover;
                }
              }

              @include dark-mode {
                color: $footer-hover-dark;

                b {
                  background: $footer-hover-dark;
                }
              }

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

          @include dark-mode {
            border-color: rgb(87 87 87);
          }

          padding: $space * 0.8 0 $space * 1.4 $space * 0.8;

          &:active b {
            text-decoration: underline;
          }

          b {
            color: black;
            font-weight: 500;
            font-size: f-size(1.02);
            min-height: 20px;
            line-height: 20px;
            display: block;
            transition: $common-transition;
            word-break: break-word;
            letter-spacing: 0.2px;

            @include dark-mode {
              color: white;
            }
          }

          .foot {
            margin-top: math.div($space, 1.5);
            font-size: f-size(0.75);
            color: $footer-color;
            transition: $common-transition;
            height: 18px;

            @include dark-mode {
              &,
              b {
                color: $footer-color-dark;
              }
            }

            b {
              height: 60%;
              margin: 0 8px;
              width: 1px;
              background: $footer-color;
            }

            .visitors {
              margin: 0 0 0 auto;

              svg {
                @include square(15px);

                @include dark-mode {
                  fill: rgb(226 226 226);
                }

                fill: $footer-color;
                margin-right: 4px;
              }
            }
          }
        }
      }
    }

    .empty {
      color: rgb(53 53 53);
      font-size: 1rem;

      @include dark-mode {
        color: rgb(212 212 212);
      }

      margin-top: 20px;
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
