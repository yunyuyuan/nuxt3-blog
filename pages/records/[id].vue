<script setup lang="ts">
import { formatTime, useContentPage, useComment, translate, initViewer, useCommonSEOTitle } from "~/utils/nuxt";
import { type RecordItem } from "~/utils/common";
import Visitors from "~/utils/nuxt/public/visitors";

const { item, writeDate, htmlContent, markdownRef } = await useContentPage<RecordItem>();
useCommonSEOTitle(computed(() => `${translate("records")}: ${formatTime(item.time, "date")}`));

const { root } = useComment(item.showComments);
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
    <div class="text" :class="{'has-comment': item.showComments}">
      <div class="header flex">
        <writeDate />
        <Visitors :visitors="item.visitors" />
      </div>
      <div class="article-container">
        <article ref="markdownRef" class="--markdown" v-html="htmlContent" />
      </div>
    </div>
  </div>
</template>

<style lang="scss">
.record-detail {
  margin: 30px 20px 80px;

  >.images {
    display: flex;
    flex-wrap: wrap;

    img {
      margin: 0 10px 10px 0;
      max-width: 600px;
      max-height: 300px;
    }
  }

  >.text {
    margin-top: 10px;

    .header {
      border-bottom: 1px solid #b9b9b9;

      .visitors {
        margin-left: auto;
        font-size: f-size(0.75);
        color: rgb(54 54 54);

        @include dark-mode {
          color: rgb(221 221 221);
        }

        svg {
          margin-right: 5px;
          fill: rgb(54 54 54);

          @include dark-mode {
            fill: white;
          }

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
