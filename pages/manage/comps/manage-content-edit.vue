<script setup lang="ts" generic="T extends CommonItem">
import { createCommit, deleteList } from "ls:~/utils/nuxt/manage/github";
import type { Ref } from "vue";
import MdEditor from "~/pages/manage/comps/md-editor.vue";
// eslint-disable-next-line no-unused-vars
import { type CommonItem, HeaderTabs, getEncryptedBlocks, getNowStamp, processEncryptDecrypt } from "~/utils/common";
import { notify, deepClone, translate, getLocalStorage, rmLocalStorage, compareMd, loadOrDumpDraft, randomId, useManageContent } from "~/utils/nuxt";

const props = defineProps<{
  preProcessItem?:(_item: T, _list?: T[]) => void;
  /** 更新之前处理item，附带markdown信息 */
  processWithContent?:(_md: string, _html: HTMLElement, _item: T) => void;
}>();

const slots = Object.keys(useSlots()).filter(key => !key.startsWith("_"));

const {
  statusText, processing, toggleProcessing,
  hasDraft,
  resetOriginItem,
  resetDraftItem,
  markdownModified,
  markdownModifiedForDraft,
  canUpload,
  canDelete,
  targetTab,
  list,
  item,
  isNew,
  decrypted,
  blockDecrypted,
  draftMarkdownContent,
  markdownContent
} = await useManageContent<T>();

const activeRoute = targetTab.url;
const encryptor = useEncryptor();

if (props.preProcessItem) {
  props.preProcessItem(item, list);
}

const currentOperate = ref<"upload" | "delete" | "">("");
const showDeleteModal = ref(false);
const showPreviewModal = ref(false);

let markdownRef: Ref | null = null;
const getHtml = (ref: Ref) => {
  markdownRef = ref;
};
const inputMarkdown = ref<string>("");
watch(markdownContent, (text) => {
  inputMarkdown.value = text;
}, { immediate: true });
watch([inputMarkdown, markdownContent], ([text, text1]) => {
  markdownModified.value = !compareMd(text, text1);
});
watch([inputMarkdown, draftMarkdownContent], ([text, text1]) => {
  markdownModifiedForDraft.value = !compareMd(text, text1);
});

const baseInfo = ref<HTMLElement>();
const previewInfo = ref("");
const previewContent = ref("");

/** 更新list */
const replaceOld = (newItem?: T) => {
  const cloneList = list.map(item => deepClone(item));
  if (!!newItem && isNew) {
    // 更新item且是新增
    cloneList.splice(0, 0, newItem);
  } else if (newItem) {
    cloneList.splice(
      list.findIndex(i => i.id === item.id),
      1,
      newItem
    );
  } else {
    cloneList.splice(list.findIndex(i => i.id === item.id), 1);
  }
  return cloneList;
};
const getUploadInfo = async () => {
  // 检查是否invalid
  const invalidInfo = baseInfo.value!.querySelectorAll<HTMLElement>("span.invalid");
  if (invalidInfo.length) {
    return notify({
      type: "error",
      title: translate("missing-info"),
      description: translate("missing") + `: ${Array.from(invalidInfo)
        .map(el => el.innerText)
        .join(", ")}`
    });
  }
  // 需要clone一份item，clone的item仅用于上传
  const newItem = deepClone(item) as T;
  let mdContent = inputMarkdown.value;
  // 处理item
  if (props.processWithContent) {
    props.processWithContent(mdContent, markdownRef!.value, newItem);
  }
  if (newItem.encrypt) {
    // 处理加密
    if (!encryptor.usePasswd.value) {
      return notify({
        type: "error",
        title: translate("need-passwd")
      });
    }
    await processEncryptDecrypt(newItem, encryptor.encrypt, targetTab.url);
    mdContent = await encryptor.encrypt(mdContent);
    // 整篇加密的markdown，不会再有加密块
    delete item.encryptBlocks;
  } else if (item.encryptBlocks && !blockDecrypted.value) {
    // 未解密，不处理
  } else {
    // encryptBlocks
    const { md, blocks } = await getEncryptedBlocks(mdContent, encryptor.encrypt);
    mdContent = md;
    if (blocks.length) {
      newItem.encryptBlocks = blocks.reverse();
    } else {
      delete item.encryptBlocks;
    }
    if (item.encryptBlocks?.length && !encryptor.usePasswd.value) {
      return notify({
        type: "error",
        title: translate("need-passwd")
      });
    }
  }
  if (!newItem.id) {
    newItem.id = randomId(list);
  }
  // 更新日期
  const nowTime = getNowStamp();
  if (isNew) {
    newItem.time = nowTime;
  }
  newItem.modifyTime = nowTime;
  // 删除_show和visitors
  const _newItem = newItem;
  delete (_newItem as any).visitors;
  delete (_newItem as any)._show;
  return {
    item: _newItem,
    md: mdContent
  };
};
const previewInfoEl = ref();
const previewMdEl = ref();
const setPreviewInfo = async () => {
  const info = await getUploadInfo();
  if (!info) { return; }
  const { item, md } = info;
  previewInfo.value = JSON.stringify(item, null, 4);
  previewContent.value = md;
  showPreviewModal.value = true;
  nextTick(async () => {
    const hljs = (await import("highlight.js")).default;
    hljs.highlightElement(previewInfoEl.value);
    hljs.highlightElement(previewMdEl.value);
  });
};
const doUpload = async () => {
  const info = await getUploadInfo();
  if (!info) { return; }
  const { item: newItem, md } = info;
  currentOperate.value = "upload";
  toggleProcessing();
  createCommit(`Update ${HeaderTabs.find(i => i.url === activeRoute)!.name}-${newItem.id}`, [
    {
      path: `public/rebuild/json${activeRoute}.json`,
      content: JSON.stringify(replaceOld(newItem), null, 2)
    },
    {
      path: `public/rebuild${activeRoute}/${newItem.id}.md`,
      content: md
    }
  ]).then((success) => {
    if (success) {
      resetOriginItem(inputMarkdown.value);
    }
  }).finally(() => {
    currentOperate.value = "";
    toggleProcessing();
  });
};

const doDelete = () => {
  showDeleteModal.value = false;
  currentOperate.value = "delete";
  toggleProcessing();
  deleteList(replaceOld(), [item]).finally(() => {
    currentOperate.value = "";
    toggleProcessing();
  });
};

const draftPrefix = () => `draft-${activeRoute.substring(1)}-${isNew ? "new" : item.id}`;
const loadDraft = () => {
  inputMarkdown.value = loadOrDumpDraft(draftPrefix(), "load", item) as string;
  resetDraftItem(inputMarkdown.value);
};
const dumpDraft = () => {
  loadOrDumpDraft(draftPrefix(), "dump", item, inputMarkdown.value);
  resetDraftItem(inputMarkdown.value);
  hasDraft.value = true;
};
const delDraft = () => {
  rmLocalStorage(draftPrefix());
  notify({
    title: translate("draft-deleted")
  });
  hasDraft.value = false;
};
onMounted(() => {
  hasDraft.value = getLocalStorage(draftPrefix()) !== null;
});
</script>

<template>
  <div class="manage-content-header flex">
    <div class="draft flex">
      <common-button theme="default" size="small" :disabled="!hasDraft" @click="loadDraft">
        {{ $t('load-draft') }}
      </common-button>
      <common-button theme="default" size="small" class="load-draft" @click="dumpDraft">
        {{ $t('save-draft') }}
      </common-button>
      <common-button theme="default" size="small" :disabled="!hasDraft" @click="delDraft">
        {{ $t('delete-draft') }}
      </common-button>
    </div>
    <span class="status">{{ statusText }}</span>
    <common-button
      icon="upload"
      :disabled="!canUpload || currentOperate === 'delete' || !decrypted"
      :loading="processing && currentOperate === 'upload'"
      @click="doUpload"
    >
      {{ $T(isNew ? "publish" : "update") }}
    </common-button>
    <common-button
      v-if="!isNew"
      class="delete"
      theme="danger"
      icon="delete"
      :disabled="!canDelete || currentOperate === 'upload'"
      :loading="processing && currentOperate === 'delete'"
      @click="showDeleteModal = true"
    >
      {{ $T('del') }}
    </common-button>
  </div>
  <div class="manage-content-base-info flexc" :title="item.encrypt && !decrypted ? $t('need-decrypt') : ''" :data-title="$TT('base-info')">
    <span v-if="isNew" class="new flex">
      <svg-icon name="new" />
    </span>
    <div ref="baseInfo" class="info detail">
      <span>
        <b>{{ $t('encrypt') }}</b>
        <svg-icon name="encrypt" />
      </span>
      <common-checkbox
        :checked="item.encrypt"
        :disabled="!decrypted || !blockDecrypted"
        :title="!blockDecrypted ? $t('decrypt-blocks') : ''"
        @change="item.encrypt = $event"
      />
      <slot v-for="slot in slots" :name="slot" :item="item" :disabled="!decrypted" />
    </div>
  </div>
  <div class="manage-content-md-info" :data-title="$TT('content')">
    <client-only>
      <md-editor
        v-model="inputMarkdown"
        :get-html="getHtml"
        :disabled="!decrypted || !blockDecrypted"
        @preview="setPreviewInfo()"
      />
    </client-only>
  </div>
  <common-modal
    v-model="showDeleteModal"
    confirm-theme="danger"
    @confirm="doDelete"
  >
    <template #title>
      {{ $T('confirm-delete') }}
    </template>
  </common-modal>
  <common-modal
    v-model="showPreviewModal"
    :show-ok="false"
    :show-cancel="false"
    modal-width="1000"
    wrap-class="preview-modal"
    @confirm="showPreviewModal = false"
  >
    <template #title>
      {{ $T('preview') }}
    </template>
    <template #body>
      <p>{{ $TT('base-info') }}</p>
      <span ref="previewInfoEl" class="language-json info">{{ previewInfo }}</span>
      <p>{{ $TT('content') }}</p>
      <span ref="previewMdEl" class="language-markdown md">{{ previewContent }}</span>
    </template>
  </common-modal>
</template>

<style lang="scss">
.manage-content {
  &-header {
    padding: 20px 0 10px;
    border-bottom: 1px solid rgb(220 220 220);

    .status {
      font-size: f-size(0.75);
      margin: 0 15px 0 auto;
      color: #b80000;

      @include dark-mode {
        color: #ffa6a6;
      }
    }

    .draft {
      margin-right: auto;
      align-self: stretch;
      align-items: flex-end;

      .load-draft {
        margin: 0 6px;
      }
    }

    .delete {
      margin-left: 12px;
    }
  }

  $border: rgb(216 216 216);
  $border-dark: rgb(53 53 53);
  $bg-dark: rgb(39 39 39);

  &-base-info > .detail,
  &-md-info > .manage-md-editor {
    border-radius: 0 4px 4px;
    box-shadow: 0 0 15px rgb(0 0 0 / 7%);
    border: 1px solid $border;

    @include dark-mode {
      box-shadow: 0 0 15px rgb(255 255 255 / 10%);
      border-color: $border-dark;
    }
  }

  &-base-info,
  &-md-info {
    position: relative;

    &::before {
      content: attr(data-title);
      display: block;
      background: white;
      color: #4d4d4d;

      @include dark-mode {
        background: $bg-dark;
        color: #fdfdfd;
      }

      padding: 7px 16px;
      position: absolute;
      top: 1px;
      left: 0;
      font-size: f-size(0.85);
      border-radius: 3px 3px 0 0;
      border: 1px solid $border;

      @include dark-mode {
        border-color: $border-dark;
      }

      border-bottom: none;
      transform: translateY(-100%);
      z-index: 2;
    }
  }

  &-base-info {
    margin: 40px 0 50px;
    position: relative;

    > .new {
      position: absolute;
      right: 0;
      top: 0;
      transform: translateY(-100%);

      > svg {
        @include square(36px);

        fill: $theme-color-darken;

        @include dark-mode {
          fill: $theme-color-lighten;
        }
      }
    }

    > .info {
      width: 100%;
      background: white;

      @include dark-mode {
        background: $bg-dark;
      }

      padding: 24px 10px;
      box-sizing: border-box;
      z-index: 1;
      display: grid;
      align-items: center;
      grid-template-columns: auto 1fr;
      grid-auto-rows: auto;
      grid-gap: 15px 0;

      > span {
        height: 30px;
        margin: 0 12px 0 8px;
        flex-shrink: 0;
        display: flex;
        align-items: center;
        justify-content: flex-end;

        b {
          position: relative;
          font-size: f-size(0.8);
          font-weight: 600;
          color: #222;
        }

        @include dark-mode {
          b {
            color: white;
          }
        }

        &.invalid b::before {
          content: "*";
          color: red;
          font-size: f-size(0.9);
          left: 0;
          position: absolute;
          transform: translateX(-100%);
        }

        svg {
          @include square(18px);

          fill: $theme-color;
          margin-left: 8px;

          @include dark-mode {
            fill: $theme-color-lighten;
          }
        }
      }

      input,
      textarea {
        font-size: f-size(0.88);
        padding: 6px;
        flex-grow: 1;
        max-width: 500px;
        min-width: 100px;
      }

      textarea {
        resize: vertical;
        max-width: 800px;
        height: 200px;
      }
    }

    >.common-loading {
      position: absolute;
      border-radius: 0 4px 4px;
      background: rgb(255 255 255 / 60%);

      @include dark-mode {
        background: rgb(255 255 255 / 20%);
      }

      justify-content: center;
      top: 0;
      left: 0;
      z-index: 2;

      @include square;
    }
  }

  &-md-info {
    margin-bottom: 30px;
  }
}

.preview-modal {
  .modal-body {
    > p {
      background: $theme-color;
      color: white;
      font-size: f-size();
      padding: 6px;
      text-align: center;
    }

    > span {
      display: block;
      padding: 8px;
      overflow-x: auto;
      border: 1px solid rgb(187 187 187);

      &.info {
        white-space: pre;
        padding-bottom: 30px;
        margin-bottom: 30px;
        font-family: $font-code;
      }

      &.md {
        white-space: pre-line;
        word-break: break-word;
      }
    }
  }
}

@include mobile {
  .manage-content {
    &-header {
      position: relative;
      flex-wrap: wrap;

      .status {
        position: absolute;
        margin: 0;
        right: 0;
        top: 0;
        transform: translateY(-50%);
      }
    }

    &-base-info > .detail {
      >span {
        margin: 0 12px 0 8px;
      }

      input,
      textarea,
      select {
        max-width: unset;
        min-width: unset;
        width: 100%;
        box-sizing: border-box;
      }

      select {
        width: 100px;
      }
    }
  }
}
</style>
