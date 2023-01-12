<script setup lang="ts">
import type { Ref } from "vue";
import { ArticleItem, Translation } from "~/utils/types";
import ManageContentEdit from "~/comps/manage-content-edit.vue";

const allTags = reactive(new Set<string>());
const showTagSelect = ref<boolean>(false);
const tagParentRef = ref<HTMLLabelElement>();

// 输入的tag和实际上传的tag不同，上传的tag需要去重
const inputTags = ref<string>("");
const inputTagsList = ref<string[]>();
const calcTagsList = () => {
  inputTagsList.value = !inputTags
    ? []
    : Array.from(new Set(inputTags.value
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => !/^\s*$/.test(tag))));
};
watch(inputTags, () => calcTagsList());
const toggleTag = (tag: string) => {
  if (inputTagsList.value.includes(tag)) {
    inputTags.value = inputTags.value.replace(new RegExp(`,?\\s*${tag}(\\s*|,|$)`), "");
  } else {
    inputTags.value = inputTags.value.concat(`,${tag}`);
  }
  calcTagsList();
};

const preProcessItem = (item: ArticleItem, list: Ref<ArticleItem[]>) => {
  const cancelTags = watch(list, (lis) => {
    try {
      lis.forEach(item => item.tags.forEach(t => allTags.add(t)));
      cancelTags();
    } catch {}
  }, { immediate: true });
  watch(item.tags, (tags) => {
    inputTags.value = tags.join(",");
    calcTagsList();
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
          <div
            ref="tagParentRef"
            :title="item.encrypt ? '加密文章不可输入tag' : null"
            class="input-tags flex"
            :class="{ disabled: disabled || item.encrypt }"
          >
            <input v-model="inputTags" :disabled="disabled || item.encrypt" @focusin="showTagSelect = true">
            <div class="placeholder s100 flex">
              <span v-if="!inputTagsList.length || item.encrypt" class="text">输入标签，用英文逗号分隔</span>
              <template v-if="!item.encrypt">
                <the-tag v-for="tag in inputTagsList" :key="tag">
                  {{
                    tag
                  }}
                </the-tag>
              </template>
            </div>
            <common-dropdown v-model:show="showTagSelect" :parent="tagParentRef">
              <p>已有标签：</p>
              <div class="dropdown w100 flex">
                <the-tag v-for="tag in allTags" :key="tag" :active="inputTagsList.includes(tag)" @click="toggleTag(tag)">
                  {{
                    tag
                  }}
                </the-tag>
              </div>
            </common-dropdown>
          </div>
        </div>
      </template>
    </manage-content-edit>
  </div>
</template>

<style lang="scss">
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

        @include dark-mode {
          color: white;
        }

        & ~ .placeholder {
          opacity: 0;
        }
      }

      &:disabled {
        background: rgb(0 0 0 / 5%);
      }
    }

    .placeholder {
      opacity: 1;
      z-index: 1;
      position: absolute;
      top: 0;
      left: 0;
      overflow: hidden;

      >.text {
        color: rgb(157 157 157);
        font-size: f-size(0.8);
        padding-left: 5px;
      }

      .common-tag {
        margin-left: 5px;
      }
    }

    .common-dropdown {
      width: 100%;

      > p {
        font-size: f-size(0.75);
        margin: 8px 0 0 8px;
      }

      .dropdown {
        flex-wrap: wrap;
        margin: 0 0 8px 8px;

        .common-tag {
          margin: 8px 8px 0 0;
        }
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
