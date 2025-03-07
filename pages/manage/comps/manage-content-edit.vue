<script setup lang="ts" generic="T extends CommonItem">
import { createCommit, deleteList } from "ls:~/utils/nuxt/manage/github";
import { FolderOpen, Lock, MessageCircleMore, Save, Trash2, Upload } from "lucide-vue-next";
import MdEditor from "~/pages/manage/comps/md-editor.vue";
import { getNowStamp } from "~/utils/common/dayjs";
import { encryptDecryptItem, getEncryptedBlocks } from "~/utils/common/process-encrypt-decrypt";
import type { CommonItem } from "~/utils/common/types";
import { escapeNewLine } from "~/utils/common/utils";
import { translate } from "~/utils/nuxt/i18n";
import { randomId } from "~/utils/nuxt/manage";

import { useManageContent, deleteItem, editItem } from "~/utils/nuxt/manage/detail";
import { notify } from "~/utils/nuxt/notify";
import { deepClone } from "~/utils/nuxt/utils";

const props = defineProps<{
  preProcessItem?: (editingItem: Ref<T>, originList: T[]) => void;
  /** 更新之前处理item，附带markdown信息 */
  processWithContent?: (md: string, item: T) => void;
}>();

const encryptor = useEncryptor();

const slots = defineSlots<Record<string, (_: { item: T; disabled: boolean }) => void>>();

const slotsRow = computed(() => Object.keys(slots).filter(key => !key.startsWith("_")));

const {
  originList,
  decryptedItem,
  editingItem,
  editingMd,
  saveDraft,
  deleteDraft,
  applyDraft,
  decrypted,

  statusText,
  processing,
  toggleProcessing,

  hasDraft,
  canUpload,
  canDelete,
  targetTab,
  isNew
} = await useManageContent<T>();

props.preProcessItem?.(editingItem, originList);

const currentOperate = ref<"upload" | "delete" | "">("");
const showDeleteModal = ref(false);
const showPreviewModal = ref(false);

const baseInfo = ref<HTMLElement>();
const previewInfo = ref("");
const previewContent = ref("");

const getUploadInfo = async () => {
  // 检查是否invalid
  const invalidInfo = baseInfo.value!.querySelectorAll<HTMLElement>(".form-item-invalid");
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
  const newItem = deepClone(editingItem.value) as T;
  let mdContent = escapeNewLine(editingMd.value);
  // 处理item
  if (props.processWithContent) {
    props.processWithContent(mdContent, newItem);
  }
  if (newItem.encrypt) {
    // 处理加密
    if (!encryptor.usePasswd.value) {
      return notify({
        type: "error",
        title: translate("need-passwd")
      });
    }
    await encryptDecryptItem(newItem, encryptor.encrypt, targetTab.url);
    mdContent = await encryptor.encrypt(mdContent);
    // 整篇加密的markdown，不会再有加密块
    delete newItem.encryptBlocks;
  } else {
    // encryptBlocks maybe
    const { md, blocks } = await getEncryptedBlocks(mdContent, encryptor.encrypt);
    mdContent = md;
    if (blocks.length) {
      newItem.encryptBlocks = blocks.reverse();
    } else {
      delete newItem.encryptBlocks;
    }
    if (newItem.encryptBlocks?.length && !encryptor.usePasswd.value) {
      return notify({
        type: "error",
        title: translate("need-passwd")
      });
    }
  }
  // 更新日期
  const nowTime = getNowStamp();
  if (isNew) {
    newItem.id = randomId(originList);
    newItem.time = nowTime;
  }
  newItem.modifyTime = nowTime;
  return {
    item: {
      ...newItem,
      _show: undefined,
      _visitors: undefined
    },
    md: mdContent
  };
};

const previewInfoEl = ref();
const previewMdEl = ref();
const setPreviewInfo = async () => {
  const info = await getUploadInfo();
  if (!info) {
    return;
  }
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
  if (!info) {
    return;
  }
  const { item: newItem, md } = info;
  currentOperate.value = "upload";
  toggleProcessing();
  try {
    const success = await createCommit(`Update ${targetTab.name}-${newItem.id}`, [
      {
        path: `public/rebuild/json${targetTab.url}.json`,
        content: JSON.stringify(editItem(originList, newItem))
      },
      {
        path: `public/rebuild${targetTab.url}/${newItem.id}.md`,
        content: md
      }
    ]);
    if (success) {
      useUnsavedContent().value = false;
    }
  } finally {
    currentOperate.value = "";
    toggleProcessing();
  }
};

const doDelete = async () => {
  showDeleteModal.value = false;
  currentOperate.value = "delete";
  toggleProcessing();
  try {
    await deleteList(deleteItem(originList, unref(editingItem)), [decryptedItem.value]);
  } finally {
    currentOperate.value = "";
    toggleProcessing();
  }
};
</script>

<template>
  <main class="!bg-transparent !shadow-none">
    <div :class="twMerge($style.box, 'mb-6 flex flex-wrap items-center justify-between gap-3')">
      <div class="flex flex-wrap items-center gap-2">
        <CommonButton
          size="small"
          :disabled="!hasDraft"
          :icon="FolderOpen"
          @click="applyDraft"
        >
          {{ $t('load-draft') }}
        </CommonButton>
        <CommonButton
          size="small"
          :icon="Save"
          @click="saveDraft"
        >
          {{ $t('save-draft') }}
        </CommonButton>
        <CommonButton
          size="small"
          :disabled="!hasDraft"
          :icon="Trash2"
          @click="deleteDraft"
        >
          {{ $t('delete-draft') }}
        </CommonButton>
      </div>

      <div class="flex items-center gap-4">
        <span class="ml-2 text-sm text-red-500">{{ statusText }}</span>
        <CommonButton
          :icon="Upload"
          :disabled="!canUpload || currentOperate === 'delete' || !decrypted"
          :loading="processing && currentOperate === 'upload'"
          data-testid="item-upload-btn"
          theme="primary"
          @click="doUpload"
        >
          {{ $t(isNew ? "publish" : "update") }}
        </CommonButton>
        <CommonButton
          v-if="!isNew"
          theme="danger"
          :icon="Trash2"
          :disabled="!canDelete || currentOperate === 'upload'"
          :loading="processing && currentOperate === 'delete'"
          data-testid="item-delete-btn"
          @click="showDeleteModal = true"
        >
          {{ $t('del') }}
        </CommonButton>
      </div>
    </div>

    <div
      ref="baseInfo"
      :class="twMerge($style.box, $style.form)"
      :title="editingItem.encrypt && !decrypted ? $t('need-decrypt') : ''"
    >
      <div class="mb-4 flex gap-6 border-b border-dark-200 pb-4 dark:border-dark-700">
        <div class="!flex-row items-center !gap-3">
          <span>
            <Lock class="inline-block size-5" />
            {{ $t('encrypt') }}
          </span>
          <common-checkbox
            :checked="editingItem.encrypt"
            :disabled="!decrypted"
            :title="!decrypted ? $t('decrypt-blocks') : ''"
            test-id="item-encrypt-checkbox"
            @change="editingItem.encrypt = $event"
          />
        </div>
        <div class="!flex-row items-center !gap-3">
          <span>
            <MessageCircleMore class="inline-block size-5" />
            {{ $t('show-comments') }}
          </span>
          <common-checkbox
            :checked="editingItem.showComments"
            :disabled="!decrypted"
            :title="$t('show-comments')"
            test-id="item-show-comment-checkbox"
            @change="editingItem.showComments = $event"
          />
        </div>
      </div>

      <div class="mt-4 space-y-4">
        <slot
          v-for="slot in slotsRow"
          :name="slot"
          :item="editingItem"
          :disabled="!decrypted"
        />
      </div>
    </div>
  </main>

  <div
    :class="$style.box"
  >
    <client-only>
      <md-editor
        v-model="editingMd"
        :disabled="!decrypted"
        @preview="setPreviewInfo"
      />
    </client-only>
  </div>

  <common-modal
    v-model="showDeleteModal"
    confirm-theme="danger"
    test-id="confirm-item-delete"
    @confirm="doDelete"
  >
    <template #title>
      {{ $t('confirm-delete') }}
    </template>
  </common-modal>

  <common-modal
    v-model="showPreviewModal"
    :show-ok="false"
    :show-cancel="false"
    modal-width="720px"
    wrap-class="preview-modal"
    @confirm="showPreviewModal = false"
  >
    <template #title>
      {{ $t('preview') }}
    </template>
    <template #body>
      <div :class="$style.preview">
        <p>{{ $t('base-info') }}</p>
        <span ref="previewInfoEl">{{ previewInfo }}</span>
        <p>{{ $t('content') }}</p>
        <span ref="previewMdEl">{{ previewContent }}</span>
      </div>
    </template>
  </common-modal>
</template>

<style module>
.box {
  @apply p-4 bg-white dark:bg-dark-800 shadow-md rounded-lg;
}

.form {
  @apply my-6;

  :global(>div >div) {
    @apply flex flex-col gap-2;

    >span:first-of-type {
      @apply flex items-center gap-1 after:content-[":"] text-sm text-dark-600 dark:text-dark-300;
      svg {
        @apply opacity-70;
      }
    }
  }
}

.preview {
  @apply flex flex-col gap-2;

  > p {
    @apply py-1 bg-primary-200 dark:bg-primary-700 text-center text-sm sticky -top-4 rounded;
  }

  > span {
    @apply whitespace-pre-wrap break-all mt-1 p-2;
  }
}
</style>
