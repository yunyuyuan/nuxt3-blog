<script setup lang="ts">
import axios from "axios";
import { Info, Plus, Save, Upload } from "lucide-vue-next";
import ClipboardJS from "clipboard";
import { translate } from "~/utils/nuxt/i18n";
import { getLocalStorage, setLocalStorage } from "~/utils/nuxt/localStorage";
import { notify } from "~/utils/nuxt/notify";
import { watchUntil } from "~/utils/nuxt/utils";

const show = defineModel<boolean>({ required: true });

const r2Enabled = __NB_R2_ENABLED__;

const dragIn = ref(false);
const file = ref<File>();
const fileUrl = ref();
const isImage = computed(() => file.value?.type.startsWith("image"));
const isVideo = computed(() => file.value?.type.startsWith("video"));
const r2SecretAccessKey = ref(getLocalStorage("r2-secret-access-key") || "");
const tinyPngToken = ref(getLocalStorage("tinypng-token") || "");
const resultUrl = ref("");
const uploading = ref(false);

const setFile = (e: Event) => {
  const f = (e.target as HTMLInputElement).files?.[0];
  if (f) {
    file.value = f;
  }
};
const dropFile = (ev: DragEvent) => {
  dragIn.value = false;
  let f: File | null;

  if (ev.dataTransfer?.items) {
    const item = ev.dataTransfer.items[0];
    if (item?.kind === "file") {
      f = item.getAsFile()!;
    } else {
      f = null;
    }
  } else {
    f = ev.dataTransfer?.files[0] ?? null;
  }
  if (!f) {
    return notify({
      type: "warn",
      title: translate("no-file-selected")
    });
  }
  file.value = f;
};
const onPaste = (event: ClipboardEvent) => {
  const items = event.clipboardData && event.clipboardData.items;
  if (items && items.length) {
    const f = items[0]?.getAsFile();
    if (f) {
      file.value = f;
    }
  }
};

watch(file, (f) => {
  if (f) {
    fileUrl.value = URL.createObjectURL(f);
  }
});

const saveToken = (k: string, v: string) => {
  setLocalStorage(k, v);
  notify({
    title: translate(v ? "token-saved" : "token-deleted-from-local")
  });
};

const afterUpload = (res: any) => {
  try {
    if (typeof res === "string") {
      throw new TypeError(res);
    }
    if (res.data.success) {
      resultUrl.value = res.data.url;
      notify({
        title: translate("upload-successful"),
        description: translate("manually-copy-link")
      });
    } else {
      throw new Error(res.data.message);
    }
  } catch (e: any) {
    notify({
      type: "error",
      title: translate("upload-failed"),
      description: e.toString()
    });
  } finally {
    uploading.value = false;
  }
};

const doUpload = async () => {
  uploading.value = true;
  try {
    const formData = new FormData();
    formData.append("secretAccessKey", r2SecretAccessKey.value);
    formData.append("tinyPngToken", tinyPngToken.value);
    formData.append("file", file.value!);
    const res = await axios({
      url: "/api/r2/upload",
      method: "post",
      data: formData
    });
    afterUpload(res);
  } catch (e) {
    afterUpload(JSON.stringify(e));
  }
};

const resultInput = ref<HTMLInputElement>();
let clipboard: any;

watchUntil(resultInput, (el) => {
  clipboard = new ClipboardJS(el, {
    target: function (trigger: HTMLElement) {
      return trigger;
    }
  }).on("success", () => {
    notify({
      title: translate("copy-successful")
    });
  });
  document.addEventListener("paste", onPaste);
}, {}, "boolean", "cancelAfterUntil");

onUnmounted(() => {
  clipboard?.destroy();
  document.removeEventListener("paste", onPaste);
});
</script>

<template>
  <common-modal
    v-model="show"
    wrap-class="upload-file"
    :show-ok="false"
    :show-cancel="false"
    @update:model-value="show = $event"
  >
    <template #title>
      <span :class="!r2Enabled && 'text-red-500'">{{ $t('upload-file') }}</span>&nbsp;
      <a
        v-if="!r2Enabled"
        class="text-sm text-red-500 underline"
        target="_blank"
        href="https://github.com/yunyuyuan/nuxt3-blog/wiki/2.2-%E4%B8%8A%E4%BC%A0%E5%9B%BE%E7%89%87"
      ><Info class="inline-block size-4" /></a>
      <template v-else>
        <a
          class="underline"
          target="_blank"
          href="https://developers.cloudflare.com/r2/"
        >R2
          <Info class="inline-block size-4" /></a>
        &
        <a
          class="underline"
          target="_blank"
          href="https://tinypng.com/developers"
        >tinypng
          <Info class="inline-block size-4" /></a>
      </template>
    </template>
    <template #body>
      <div class="flex flex-col px-2">
        <div class="flex items-center gap-1">
          <span>{{ $t('upload-result') }}: </span>
          <input
            ref="resultInput"
            v-model="resultUrl"
            :placeholder="$t('no-result')"
            readonly
            class="grow"
          >
        </div>
        <label
          :class="
            twMerge(
              'relative cursor-pointer my-4 py-2 flex h-48 w-full items-center justify-center rounded-lg border-2 border-dotted border-primary-400 text-primary-500 transition hover:text-primary-600',
              dragIn && 'bg-dark-100 dark:bg-dark-700'
            )"
          @dragleave="dragIn = false"
          @dragenter.prevent
          @dragover.prevent="!dragIn && (dragIn = true)"
          @drop.prevent="dropFile"
        >
          <input
            type="file"
            accept="*/*"
            class="hidden"
            @change="setFile"
          >
          <div
            v-if="!file"
            class="flex flex-col items-center gap-1"
          >
            <Plus class="size-8" />
            <span>{{ $t('select-file') }}</span>
          </div>
          <video
            v-else-if="isVideo"
            class="size-full object-contain"
            :src="fileUrl"
            controls
          />
          <img
            v-else-if="isImage"
            class="size-full object-contain"
            :src="fileUrl"
          >
          <span v-else>{{ file.name }}</span>
        </label>
        <div class="flex flex-col gap-2">
          <div class="flex items-center">
            <input
              v-model="r2SecretAccessKey"
              type="password"
              class="grow"
              :placeholder="$t('please-input') + ' R2 Secret Access Key'"
            >
            <button
              class="ml-2 text-primary-600"
              :title="$t('save')"
              @click="saveToken('r2-secret-access-key', r2SecretAccessKey)"
            >
              <Save />
            </button>
          </div>
          <div class="flex items-center">
            <input
              v-model="tinyPngToken"
              class="grow"
              :placeholder="`(${$t('optional')})${$t('please-input')} tinyPng API token`"
            >
            <button
              class="ml-2 text-primary-600"
              :title="$t('save')"
              @click="saveToken('tinypng-token', tinyPngToken)"
            >
              <Save />
            </button>
          </div>
          <CommonButton
            :icon="Upload"
            :loading="uploading"
            :disabled="!file || !r2SecretAccessKey"
            class="mt-2 self-center"
            theme="primary"
            @click="doUpload"
          >
            {{ $t('upload') }}
          </CommonButton>
        </div>
      </div>
    </template>
  </common-modal>
</template>
