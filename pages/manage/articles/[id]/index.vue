<script setup lang="ts">
import { ArticleItem, Translation } from "~/utils/types";
import ManageContentEdit from "~/comps/manage-content-edit.vue";

// 输入的tag和实际上传的tag不同，上传的tag需要去重
const inputTags = ref<string>("");
const inputTagsList = ref<string[]>();
const calcTagsList = (encrypted) => {
  inputTagsList.value = !inputTags || encrypted
    ? []
    : Array.from(new Set(inputTags.value
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => !/^\s*$/.test(tag))));
};

const preProcessItem = (item: ArticleItem) => {
  watch(item.tags, (tags) => {
    inputTags.value = tags.join(",");
    calcTagsList(item.encrypt);
  }, { immediate: true });
  watch(toRef(item, "encrypt"), (encrypted) => {
    calcTagsList(encrypted);
  }, { immediate: true });
  watch(inputTagsList, (tags) => {
    if (!item.encrypt) {
      item.tags.splice(0, item.tags.length, ...tags);
    }
  });
};

// 目前只有article类型需要根据内容计算item的`len`和`menu`字段
const processContent = (md: string, html: HTMLElement, item: ArticleItem) => {
  item.len = md.length;
  item.menu = [];
  if (item.encrypt) {
    item.tags.splice(0, item.tags.length);
  }
  html.querySelectorAll("h1, h2, h3, h4, h5, h6").forEach((el: HTMLElement) => {
    const size = ["H1", "H2", "H3"].includes(el.tagName) ? "big" : "small";
    item.menu.push({
      size,
      text: el.innerText,
      url: el.querySelector("a").getAttribute("href")
    });
  });
};
</script>

<template>
  <div class="manage-article-detail">
    <manage-content-edit :pre-process-item="preProcessItem" :process-with-content="processContent">
      <template #title="{ disabled, item }">
        <div>
          <span :class="{ invalid: !item.title }">{{ Translation.title }}
            <svg-icon name="title" />
          </span>
          <input v-model="item.title" :disabled="disabled">
        </div>
      </template>
      <template #tags="{ disabled, item }">
        <div>
          <span>{{ Translation.tags }}
            <svg-icon name="tags" />
          </span>
          <label
            :title="item.encrypt ? '加密文章不可输入tag' : null"
            class="input-tags flex"
            :class="{ disabled: disabled || item.encrypt }"
          >
            <input v-model="inputTags" :disabled="disabled || item.encrypt" @focusout="calcTagsList(item.encrypt)">
            <div class="s100 flex">
              <span v-if="!inputTagsList.length" class="placeholder">输入标签，用英文逗号分隔</span>
              <the-tag v-for="tag in inputTagsList" :key="tag">{{
                tag
              }}</the-tag>
            </div>
          </label>
        </div>
      </template>
    </manage-content-edit>
  </div>
</template>

<style lang="scss">
@import "assets/style/var";

.manage-article-detail {
  .input-tags {
    position: relative;
    width: 512px;
    min-width: 100px;

    input {
      color: transparent;
      background: transparent;
      z-index: 2;

      &:focus {
        color: black;

        & ~ div {
          opacity: 0;
        }
      }

      &:disabled {
        background: rgb(0 0 0 / 5%);
      }

      & ~ div {
        opacity: 1;
      }
    }

    > div {
      opacity: 0;
      z-index: 1;
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;

      >.placeholder {
        color: rgb(157 157 157);
        font-size: 14px;
        padding-left: 5px;
      }

      .common-tag {
        margin-left: 5px;
      }
    }
  }
}

@include mobile {
  .manage-article-detail {
    .input-tags {
      width: 100%;
    }
  }
}
</style>
