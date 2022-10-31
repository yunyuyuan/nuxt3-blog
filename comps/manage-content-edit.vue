<script setup lang="ts">
import { createCommit, deleteList } from "ls:~/utils/manage/github";
import type { Ref } from "vue";
import MdEditor from "~/comps/md-editor.vue";
import { CommonItem, HeaderTabs } from "~/utils/types";
import { notify } from "~/utils/notify/notify";
import { getNowStamp } from "~/utils/_dayjs";
import { deepClone, getLocalStorage, rmLocalStorage } from "~/utils/utils";
import { loadOrDumpDraft, randomId } from "~/utils/manage";
import { processEncryptDescrypt } from "~/utils/process-encrypt-descrypt";
import { useManageContent } from "~/utils/manage/detail";
import { encryptBlocksRegexp } from "~/utils/markdown";

const props = defineProps<{
  preProcessItem?:(_item: CommonItem, _list?: Ref<CommonItem[]> | {value: CommonItem[]}) => void;
  /** 更新之前处理item，附带markdown信息 */
  processWithContent?:(_md: string, _html: HTMLElement, _item: CommonItem) => void;
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
  markdownContent,
  pending,
  mdPending,
  listPending
} = useManageContent();

const activeRoute = targetTab.url;
const encryptor = useEncryptor();

if (props.preProcessItem) {
  props.preProcessItem(item, list);
}

const currentOperate = ref<"upload" | "delete" | "">("");
const showDeleteModal = ref(false);
const showPreviewModal = ref(false);

let markdownRef = null;
const getHtml = (ref: Ref) => {
  markdownRef = ref;
};
const inputMarkdown = ref<string>("");
watch(markdownContent, (text) => {
  inputMarkdown.value = text;
}, { immediate: true });
watch([inputMarkdown, markdownContent], ([text, text1]) => {
  markdownModified.value = text !== text1;
});
watch([inputMarkdown, draftMarkdownContent], ([text, text1]) => {
  markdownModifiedForDraft.value = text !== text1;
});

const baseInfo = ref<HTMLElement>();
const previewInfo = ref("");
const previewContent = ref("");

/** 更新list */
const replaceOld = (newItem: CommonItem) => {
  const cloneList = list.value.map(item => deepClone(item));
  if (!!newItem && isNew) {
    // 更新item且是新增
    cloneList.splice(0, 0, newItem);
  } else if (newItem) {
    cloneList.splice(
      list.value.findIndex(i => i.id === item.id),
      1,
      newItem
    );
  } else {
    cloneList.splice(list.value.findIndex(i => i.id === item.id), 1);
  }
  return cloneList;
};
const getUploadInfo = async () => {
  // 检查是否invalid
  const invalidInfo = baseInfo.value.querySelectorAll("span.invalid");
  if (invalidInfo.length) {
    return notify({
      type: "error",
      title: "缺少必要信息",
      description: `缺少：${Array.from(invalidInfo)
        .map((el: HTMLElement) => el.innerText)
        .join(", ")}`
    });
  }
  // 需要clone一份item，clone的item仅用于上传
  const newItem = deepClone(toRaw(item));
  let mdContent = inputMarkdown.value.replace("\r\n", "\n");
  // 处理item
  if (props.processWithContent) {
    props.processWithContent(mdContent, markdownRef.value, newItem);
  }
  if (newItem.encrypt) {
    // 处理加密
    if (!encryptor.usePasswd.value) {
      return notify({
        type: "error",
        title: "请先解密"
      });
    }
    await processEncryptDescrypt(newItem, encryptor.encrypt, targetTab.url);
    mdContent = await encryptor.encrypt(mdContent);
    // 整篇加密的markdown，不会再有加密块
    delete item.encryptBlocks;
  } else if (item.encryptBlocks && !blockDecrypted.value) {
    // 未解密，不处理
  } else {
    // encryptBlocks
    const reg = new RegExp(encryptBlocksRegexp, "gd");
    let matcher;
    const encryptBlocks = [];
    while (true) {
      matcher = reg.exec(mdContent);
      if (matcher) {
        if (!encryptor.usePasswd.value) {
          return notify({
            type: "error",
            title: "请先解密"
          });
        }
        const [start, end] = matcher.indices[2];
        const encryptedText = await encryptor.encrypt(matcher[2]);
        mdContent = mdContent.slice(0, start) + encryptedText + mdContent.slice(end);
        encryptBlocks.push({
          start,
          end: end + encryptedText.length - matcher[2].length
        });
      } else {
        break;
      }
    }
    if (encryptBlocks.length) {
      newItem.encryptBlocks = encryptBlocks.reverse();
    } else {
      delete item.encryptBlocks;
    }
  }
  if (!newItem.id) {
    newItem.id = randomId();
  }
  // 更新日期
  const nowTime = getNowStamp();
  if (isNew) {
    newItem.time = nowTime;
  }
  newItem.modifyTime = nowTime;
  return {
    item: newItem,
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
  createCommit(`Update ${HeaderTabs.find(i => i.url === activeRoute).name}-${newItem.id}`, [
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
  deleteList(replaceOld(null), [item]).finally(() => {
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
    title: "删除草稿成功"
  });
  hasDraft.value = false;
};
onMounted(() => {
  // FIXME Why do we need to watch item.id?
  // Seems like watcher of listPending has been triggered with wrong order.
  watch([listPending, () => item.id], ([pend, _]) => {
    if (!pend) {
      hasDraft.value = getLocalStorage(draftPrefix()) !== null;
    }
  }, { immediate: true });
});
</script>

<template>
  <div class="manage-content-header flex">
    <div class="draft flex">
      <common-button theme="default" size="small" :disabled="pending || !hasDraft" @click="loadDraft">
        加载草稿
      </common-button>
      <common-button theme="default" size="small" class="load-draft" :disabled="pending" @click="dumpDraft">
        保存草稿
      </common-button>
      <common-button theme="default" size="small" :disabled="pending || !hasDraft" @click="delDraft">
        删除草稿
      </common-button>
    </div>
    <span class="status">{{ statusText }}</span>
    <common-button
      icon="upload"
      :disabled="pending || !canUpload || currentOperate === 'delete' || (!decrypted && !mdPending)"
      :loading="processing && currentOperate === 'upload'"
      @click="doUpload"
    >
      {{ isNew ? "发布" : "更新" }}
    </common-button>
    <common-button
      v-if="!isNew"
      class="delete"
      theme="danger"
      icon="delete"
      :disabled="pending || !canDelete || currentOperate === 'upload'"
      :loading="processing && currentOperate === 'delete'"
      @click="showDeleteModal = true"
    >
      删除
    </common-button>
  </div>
  <div class="manage-content-base-info flexc" :title="item.encrypt && !decrypted ? '请先解密' : ''" data-title="基础信息">
    <span v-if="isNew" class="new flex">
      <svg-icon name="new" />
    </span>
    <div ref="baseInfo" class="info detail">
      <div>
        <span>加密
          <svg-icon name="encrypt" />
        </span>
        <common-checkbox
          :checked="item.encrypt"
          :disabled="!decrypted || !blockDecrypted"
          :title="!blockDecrypted ? '请先解密blocks' : ''"
          @change="item.encrypt = $event"
        />
      </div>
      <slot v-for="slot in slots" :name="slot" :item="item" :disabled="!decrypted" />
    </div>
    <common-loading v-show="listPending" :show-in-first="false" />
  </div>
  <div class="manage-content-md-info" data-title="内容">
    <client-only>
      <md-editor
        v-model="inputMarkdown"
        :get-html="getHtml"
        :disabled="!decrypted || !blockDecrypted"
        :loading="mdPending"
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
      确认删除?
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
      提交预览
    </template>
    <template #body>
      <p>基础信息</p>
      <span ref="previewInfoEl" class="language-json info">{{ previewInfo }}</span>
      <p>内容</p>
      <span ref="previewMdEl" class="language-markdown md">{{ previewContent }}</span>
    </template>
  </common-modal>
</template>

<style lang="scss">
@import "assets/style/var";

.manage-content {
  &-header {
    padding: 20px 0 10px;
    border-bottom: 1px solid rgb(220 220 220);

    .status {
      font-size: 13px;
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
  $border-dark: rgb(116 116 116);
  $bg-dark: rgb(73 73 73);

  &-base-info > .detail,
  &-md-info > .manage-md-editor {
    border-radius: 0 4px 4px;
    box-shadow: 0 0 15px rgb(0 0 0 / 7%);
    border: 1px solid $border;

    @include dark-mode {
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
      font-size: 15px;
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

      padding: 28px 0;
      align-items: flex-start;
      box-sizing: border-box;
      z-index: 1;

      > div {
        display: flex;
        align-items: center;
        align-self: stretch;
        padding: 0 18px;

        &:not(:last-of-type) {
          border-bottom: 1px dotted rgb(226 226 226);

          @include dark-mode {
            border-color: rgb(129 129 129);
          }

          margin-bottom: 20px;
          padding-bottom: 20px;
        }

        > span {
          height: 30px;
          font-size: 14px;
          font-weight: 600;
          margin: 0 24px 0 8px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          color: #222;
          justify-content: space-between;
          position: relative;

          @include dark-mode {
            color: white;
          }

          &.invalid::before {
            content: "*";
            color: red;
            font-size: 16px;
            left: 0;
            position: absolute;
            top: 8px;
            transform: translateX(-12px);
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
        textarea,
        select {
          font-size: 15px;
          padding: 5px;
          flex-grow: 1;
          max-width: 500px;
          min-width: 100px;
        }

        select {
          max-width: 100px;
          min-width: unset;
        }

        textarea {
          resize: vertical;
          max-width: 800px;
          height: 200px;
        }
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
      font-size: 18px;
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

      .status {
        position: absolute;
        margin: 0;
        right: 0;
        top: 0;
        transform: translateY(-50%);
      }
    }

    &-base-info > .detail {
      > div {
        padding: 0 8px;

        >span {
          margin: 0 12px 0 8px;
        }

        > div {
          flex-direction: column;
          align-items: flex-start;

          &:not(:last-of-type) {
            padding-bottom: 10px;
            margin-bottom: 10px;
          }

          > span {
            margin-left: 0;
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
  }
}
</style>
