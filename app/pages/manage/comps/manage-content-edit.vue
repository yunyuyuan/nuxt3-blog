<script setup lang="ts" generic="T extends CommonItem">
import { createCommit, deleteList } from "ls:~/utils/nuxt/manage/github";
import { FolderOpen, Hash, Lock, MessageCircleMore, Save, Trash2, Upload } from "lucide-vue-next";
import MdEditor from "~/pages/manage/comps/md-editor.vue";
import type { CommonItem } from "~/utils/common/types";
import { translate } from "~/utils/nuxt/i18n";
import { formatTime } from "~/utils/nuxt/format-time";

import { useManageContent, deleteItem, editItem } from "~/utils/nuxt/manage/detail";
import { notify } from "~/utils/nuxt/notify";
import { useStaging, type StagedItem } from "~/utils/hooks/useStaging";
import { getProcessedUploadInfo } from "~/utils/nuxt/manage/item-processor";
import { encryptDecryptItem } from "~/utils/common/process-encrypt-decrypt";
import { deepClone } from "~/utils/nuxt/utils";

const props = defineProps<{
  preProcessItem?: (editingItem: Ref<T>, originList: T[]) => void;
}>();

const encryptor = useEncryptor();
const showPwdModal = useShowPwdModal();
const { stageItem, stagedItems, getStagedItem, deleteStagedItem } = useStaging();

// 检查当前项目是否有暂存内容
const hasCurrentStaged = computed(() => {
  const currentId = Number(editingItem.value.id);
  return getStagedItem(currentId, targetTab) !== undefined;
});

const slots = defineSlots<Record<string, (_: { item: T; disabled: boolean }) => void>>();

const slotsRow = computed(() => Object.keys(slots).filter(key => !key.startsWith("_")));

const {
  originList,
  decryptedItem,
  decryptedMd,
  editingItem,
  editingMd,
  decrypted,

  statusText,
  processing,
  toggleProcessing,

  canUpload,
  canDelete,
  targetTab,
  isNew
} = await useManageContent<T>();

props.preProcessItem?.(editingItem, originList);

const currentOperate = ref<"upload" | "delete" | "">("");
const showDeleteModal = ref(false);

const baseInfo = ref<HTMLElement>();

const isValidUrlSegment = computed(() => !editingItem.value.customSlug || /^[a-zA-Z0-9\-_]+$/.test(editingItem.value.customSlug));

const doUpload = async () => {
  const info = await getProcessedUploadInfo({
    editingItem: editingItem.value,
    editingMd: editingMd.value,
    targetTab,
    originList,
    isNew,
    encryptor,
    baseInfoElement: baseInfo.value
  });
  if (!info) {
    return;
  }
  const { item: newItem, md } = info;
  currentOperate.value = "upload";
  toggleProcessing();
  try {
    const success = await createCommit(`Update ${targetTab.replace("/", "")}-${newItem.id}`, {
      additions: [
        {
          path: `public/rebuild/json${targetTab}.json`,
          content: JSON.stringify(editItem(originList, newItem))
        },
        {
          path: `public/rebuild${targetTab}/${newItem.id}.md`,
          content: md
        }
      ]
    });
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
    await deleteList(deleteItem(originList, unref(editingItem)), [{ item: decryptedItem.value, md: decryptedMd.value }]);
  } finally {
    currentOperate.value = "";
    toggleProcessing();
  }
};

const showLoadStagedModal = ref(false);
const stagedItemToLoad = ref<{ item: T; md: string } | null>(null);

const doStage = async () => {
  const processedInfo = await getProcessedUploadInfo({
    editingItem: editingItem.value,
    editingMd: editingMd.value,
    targetTab,
    originList,
    isNew: false,
    encryptor,
    baseInfoElement: baseInfo.value
  });

  if (!processedInfo) {
    return;
  }

  stageItem(processedInfo.item, processedInfo.md, targetTab);
  notify({
    type: "success",
    title: translate("staged"),
    description: translate("staged-items-count", [1])
  });
};

const overrideEditingItem = async (item: T, md: string) => {
  if ((item.encrypt || item.encryptBlocks) && !encryptor.usePasswd.value) {
    notify({
      type: "error",
      title: translate("need-passwd")
    });
    showPwdModal.value = true;
    return;
  }
  // 更新编辑中的内容
  if (item.encrypt) {
    await encryptDecryptItem(item, encryptor.decrypt, targetTab);
    editingMd.value = await encryptor.decrypt(md);
  }
  editingItem.value = item;

  if (item.encryptBlocks) {
    let newMarkdownContent = md;
    for (const block of item.encryptBlocks) {
      const { start, end } = block;
      newMarkdownContent = newMarkdownContent.slice(0, start) + await encryptor.decrypt(newMarkdownContent.slice(start, end)) + newMarkdownContent.slice(end);
    }
    editingMd.value = newMarkdownContent;
  } else if (!item.encrypt) {
    editingMd.value = md;
  }

  notify({
    type: "success",
    title: translate("staged-content-loaded"),
    description: translate("staged-content-loaded-desc")
  });
};

// 为当前项目加载暂存内容
const loadStagedForCurrentItem = async () => {
  const currentId = Number(editingItem.value.id);
  const stagedItem = getStagedItem<T>(currentId, targetTab);

  if (stagedItem) {
    await overrideEditingItem(deepClone(toRaw(stagedItem.item)), stagedItem.md);
  }
};

// 删除当前项目的暂存内容
const deleteStagedForCurrentItem = () => {
  const currentId = Number(editingItem.value.id);
  deleteStagedItem(currentId, targetTab);

  notify({
    type: "success",
    title: translate("staged-deleted"),
    description: translate("staged-deleted-desc")
  });
};

// 加载暂存的内容
const loadStagedContent = async () => {
  if (stagedItemToLoad.value) {
    await overrideEditingItem(deepClone(toRaw(stagedItemToLoad.value.item)) as T, stagedItemToLoad.value.md);
  }
  showLoadStagedModal.value = false;
  stagedItemToLoad.value = null;
};

// 取消加载暂存内容
const cancelLoadStaged = () => {
  showLoadStagedModal.value = false;
  stagedItemToLoad.value = null;
};

// 页面加载完成后初始化暂存项目并检查暂存项目
onMounted(() => {
  nextTick(() => {
    const currentId = Number(editingItem.value.id);
    const stagedItem = stagedItems.value.find(
      item => item.id === currentId && item.targetTab === targetTab
    ) as StagedItem<T>;

    if (stagedItem) {
      stagedItemToLoad.value = {
        item: stagedItem.item,
        md: stagedItem.md
      };
      showLoadStagedModal.value = true;
    }
  });
});
</script>

<template>
  <main class="!bg-transparent !shadow-none">
    <div :class="twMerge($style.box, 'mb-6 flex flex-wrap items-center gap-3')">
      <div class="flex flex-wrap items-center gap-2">
        <CommonButton
          size="small"
          :disabled="!hasCurrentStaged"
          :icon="FolderOpen"
          data-testid="load-staged-btn"
          @click="loadStagedForCurrentItem"
        >
          {{ $t('load-staged') }}
        </CommonButton>
        <CommonButton
          size="small"
          :disabled="!hasCurrentStaged"
          :icon="Trash2"
          data-testid="delete-staged-btn"
          @click="deleteStagedForCurrentItem"
        >
          {{ $t('delete-staged') }}
        </CommonButton>
      </div>

      <div class="ml-auto flex flex-wrap items-center gap-4">
        <span
          v-show="!!statusText"
          class="ml-2 text-xs text-red-500"
        >{{ statusText }}</span>
        <CommonButton
          :icon="Save"
          :disabled="!canUpload || currentOperate === 'delete' || !decrypted"
          data-testid="item-stage-btn"
          @click="doStage"
        >
          {{ $t('save-staged') }}
        </CommonButton>
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
        <div>
          <span :class="!isValidUrlSegment && 'form-item-invalid'">
            <Hash class="size-5" />
            {{ $t('custom-slug') }}
          </span>
          <input
            v-model="editingItem.customSlug"
            data-testid="item-slug-input"
            placeholder="[a-zA-Z0-9\-_]*"
            :disabled="!decrypted"
          >
        </div>
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
    :class="twMerge($style.box, 'max-md:!px-0')"
  >
    <client-only>
      <md-editor
        v-model="editingMd"
        :disabled="!decrypted"
      />
    </client-only>
  </div>

  <common-modal
    v-model="showDeleteModal"
    confirm-theme="danger"
    ok-test-id="confirm-item-delete"
    @confirm="doDelete"
  >
    <template #title>
      {{ $t('confirm-delete') }}
    </template>
  </common-modal>

  <common-modal
    v-model="showLoadStagedModal"
    modal-width="600px"
    test-id="load-staged-modal"
    ok-test-id="load-staged-ok-btn"
    cancel-test-id="load-staged-cancel-btn"
    @ok="loadStagedContent"
    @after-close="cancelLoadStaged"
  >
    <template #title>
      {{ $t('load-staged-changes') }}
    </template>
    <template #body>
      <div class="space-y-4">
        <p>{{ $t('staged-changes-found') }}</p>
        <div
          v-if="stagedItemToLoad"
          class="rounded-lg bg-gray-50 p-4 dark:bg-gray-800"
        >
          <div class="space-y-2 text-sm">
            <div>
              <span class="font-medium">{{ $t('staged-time') }}:</span>
              <span class="ml-2 text-gray-600 dark:text-gray-400">
                {{ formatTime(stagedItemToLoad.item.modifyTime || stagedItemToLoad.item.time, 'full') }}
              </span>
            </div>
            <div class="flex items-center">
              <span class="font-medium">{{ $t('title') }}:</span>
              <span class="ml-2 truncate">
                {{ 'title' in stagedItemToLoad.item ? stagedItemToLoad.item.title : `${$t('item')} ${stagedItemToLoad.item.id}` }}
              </span>
            </div>
            <div>
              <span class="font-medium">{{ $t('content-preview') }}:</span>
              <div class="mt-1 max-h-40 overflow-y-auto whitespace-pre rounded bg-white p-2 text-xs dark:bg-gray-700">
                {{ stagedItemToLoad.md }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </template>
  </common-modal>
</template>

<style module>
.box {
  @apply p-4 max-md:px-2 bg-white dark:bg-dark-800 shadow-sm rounded-lg border border-dark-100 dark:border-dark-700;
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
</style>
