<script setup lang="ts">
import { formatTime, literalTime } from "~/utils/_dayjs";
import useContentPage from "~/utils/public/detail";
import { RecordItem } from "~/utils/types";
import { useComment } from "~/utils/utils";
import config from "~/config";

const { item, tabUrl, htmlContent, publishTime, modifyTime, markdownRef, listPending, mdPending } = useContentPage<RecordItem>();

useHead({
  title: computed(() => `记录: ${formatTime(item.time, "YYYY-MM-DD")}${config.SEO_title}`)
});
const { root, hasComment } = useComment(tabUrl);
</script>

<template>
  <div ref="root" class="record-detail">
    <client-only>
      <common-loading v-if="listPending" />
      <div v-viewer class="images">
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
    </client-only>
    <div class="text" :class="{'has-comment': hasComment}">
      <p :title="'作成于 ' + publishTime + '，更新于 ' + modifyTime">
        <svg-icon name="write" />
        <time>{{ literalTime(item.time) }}</time>
      </p>
      <common-loading v-if="mdPending" />
      <client-only>
        <div v-viewer class="article-container">
          <article ref="markdownRef" class="--markdown" v-html="htmlContent" />
        </div>
      </client-only>
    </div>
  </div>
</template>

<style lang="scss">
@import "assets/style/var";

.record-detail {
  margin: 30px 20px 80px;
  min-width: 800px;
  max-width: 1600px;

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
      }

      time {
        font-size: 12px;
        line-height: 16px;
      }
    }

    >.article-container {
      padding: 8px;
    }
  }
}

@include mobile {
  .record-detail {
    min-width: unset;
  }
}
</style>
