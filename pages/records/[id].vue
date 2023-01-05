<script setup lang="ts">
import { formatTime, literalTime } from "~/utils/_dayjs";
import useContentPage from "~/utils/public/detail";
import { RecordItem } from "~/utils/types";
import { useComment } from "~/utils/utils";
import config from "~/config";
import { initViewer } from "~/utils/viewer";

const { item, tabUrl, publishTime, modifyTime, htmlContent, markdownRef, mdPending } = useContentPage<RecordItem>();

useHead({
  title: computed(() => `记录: ${formatTime(item.time, "YYYY-MM-DD")}${config.SEO_title}`)
});
const { root, hasComment } = useComment(tabUrl);
initViewer(root);
</script>

<template>
  <div ref="root" class="record-detail">
    <div class="images">
      <the-lazy-img
        v-for="img,idx in item.images"
        :key="idx"
        viewer
        :alt="img.alt"
        :src="img.src"
        :container-size="['300px', '300px']"
        :title="img.alt"
      />
    </div>
    <div class="text" :class="{'has-comment': hasComment}">
      <p class="flex" :title="'作成于 ' + publishTime + '，更新于 ' + modifyTime">
        <svg-icon name="write" />
        <time>{{ literalTime(item.time) }}</time>
        <span v-if="item.visitors >= 0" class="visitors flex" :title="`被浏览${item.visitors}次`">
          <svg-icon name="view" />
          {{ item.visitors }}
        </span>
      </p>
      <common-loading v-show="mdPending" :show-in-first="false" />
      <div class="article-container">
        <article ref="markdownRef" class="--markdown" v-html="htmlContent" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
@import "assets/style/var";

.record-detail {
  margin: 30px 20px 80px;
  width: 1000px;

  .images {
    display: flex;
    flex-wrap: wrap;

    img {
      margin: 0 10px 10px 0;
      max-width: 600px;
      max-height: 300px;
    }
  }

  .text {
    margin-top: 10px;

    > p {
      border-bottom: 1px solid #b9b9b9;

      svg {
        @include square(16px);

        fill: $theme-color;

        @include dark-mode {
          fill: $theme-color-lighten;
        }
      }

      time {
        color: black;
        font-size: 12px;
        line-height: 16px;

        @include dark-mode {
          color: rgb(221 221 221);
        }
      }

      .visitors {
        margin-left: auto;
        font-size: 13px;
        color: rgb(54 54 54);

        @include dark-mode {
          color: rgb(221 221 221);
        }

        svg {
          margin-right: 5px;
          fill: rgb(54 54 54);

          @include square(15px);
        }
      }
    }

    >.article-container {
      padding: 8px;
    }
  }
}

@include mobile {
  .record-detail {
    width: 96%;
    margin-left: 2%;
    margin-right: 2%;
  }
}
</style>
