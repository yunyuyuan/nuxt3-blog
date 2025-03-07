<script setup lang="ts">
import { Captions, Tags } from "lucide-vue-next";
import ManageContentEdit from "~/pages/manage/comps/manage-content-edit.vue";
import type { ArticleItem } from "~/utils/common/types";

const allTags = reactive(new Set<string>());
const showTagSelect = ref(false);
const tagParentRef = ref<HTMLLabelElement>();

// 输入的tag和实际上传的tag不同，上传的tag需要去重
const inputTags = ref("");
const inputTagsList = computed(() => !inputTags.value
  ? []
  : Array.from(new Set(inputTags.value
      .split(",")
      .map(tag => tag.trim())
      .filter(tag => !/^\s*$/.test(tag)))));

const toggleTag = (tag: string) => {
  if (inputTagsList.value.includes(tag)) {
    inputTags.value = inputTags.value.replace(new RegExp(`,?\\s*${tag}(\\s*|,|$)`), "");
  } else {
    inputTags.value = inputTags.value.concat(`,${tag}`);
  }
};

const preProcessItem = (editingItem: Ref<ArticleItem>, originList: ArticleItem[]) => {
  originList.forEach(item => item.tags.forEach(t => allTags.add(t)));

  watch(editingItem.value.tags, (tags) => {
    inputTags.value = tags.join(",");
  }, { immediate: true });

  watch(inputTagsList, (tags) => {
    if (tags && !editingItem.value.encrypt) {
      editingItem.value.tags.splice(0, editingItem.value.tags.length, ...tags);
    }
  });
};

// 目前只有article类型需要根据内容计算item的`len`字段
const processContent = (md: string, item: ArticleItem) => {
  item.len = md.length;
  if (item.encrypt) {
    item.tags.splice(0, item.tags.length);
  }
};
</script>

<template>
  <manage-content-edit
    :pre-process-item="preProcessItem"
    :process-with-content="processContent"
  >
    <template #title="{ disabled, item }">
      <div>
        <span :class="!item.title && 'form-item-invalid'">
          <Captions class="size-5" />
          {{ $t('title') }}
        </span>
        <input
          v-model="item.title"
          data-testid="item-title-input"
          :placeholder="$t('please-input')"
          :disabled="disabled"
        >
      </div>
    </template>
    <template #tags="{ disabled, item }">
      <div>
        <span>
          <Tags class="size-5" />
          {{ $t('tags') }}
        </span>
        <div
          ref="tagParentRef"
          :title="item.encrypt ? $t('tags-not-allowed') : undefined"
          class="relative flex"
          :class="{ disabled: disabled || item.encrypt }"
        >
          <input
            v-model="inputTags"
            data-testid="item-tags-input"
            class="peer w-full py-3 !text-transparent focus:!text-inherit"
            :disabled="disabled || item.encrypt"
            @focusin="showTagSelect = true"
          >
          <div class="pointer-events-none absolute flex size-full items-center gap-1 overflow-auto break-keep px-2 peer-focus:opacity-0">
            <span
              v-if="!inputTagsList.length || item.encrypt"
              class="text-dark-400 dark:text-dark-700"
            >
              {{ $t('input-tags') }}
            </span>
            <template v-if="!item.encrypt">
              <the-tag
                v-for="tag in inputTagsList"
                :key="tag"
              >
                {{ tag }}
              </the-tag>
            </template>
          </div>
          <common-dropdown
            v-model:show="showTagSelect"
            :parent="tagParentRef"
          >
            <div class="p-4">
              <p class="mb-2 text-sm">
                {{ $t('existed-tags') }}:
              </p>
              <div class="flex flex-wrap gap-2">
                <button
                  v-for="tag in allTags"
                  :key="tag"
                  :class="twMerge(
                    'rounded-md bg-dark-100 px-2 py-1 text-base hover:text-primary-600 dark:bg-dark-700 dark:hover:text-primary-400',
                    inputTagsList.includes(tag) && '!bg-primary-100 dark:!bg-primary-600'
                  )"
                  @click="toggleTag(tag)"
                >
                  {{ tag }}
                </button>
              </div>
            </div>
          </common-dropdown>
        </div>
      </div>
    </template>
  </manage-content-edit>
</template>
