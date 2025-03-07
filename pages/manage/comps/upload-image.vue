<script setup lang="ts">
import axios from "axios";
import FormData from "form-data";
import { Info, Plus, Save, Upload } from "lucide-vue-next";
import { translate } from "~/utils/nuxt/i18n";
import { getLocalStorage, setLocalStorage } from "~/utils/nuxt/localStorage";
import { notify } from "~/utils/nuxt/notify";

const show = defineModel<boolean>({ required: true });

const dragIn = ref(false);
const img = ref<File>();
const imgUrl = ref();
const smmsToken = ref(getLocalStorage("smms-token") || "");
const tinyPngToken = ref(getLocalStorage("tinypng-token") || "");
const resultUrl = ref("");
const uploading = ref(false);

const setImage = (e: Event) => {
  const file = (e.target as HTMLInputElement).files![0];
  if (!file.type.startsWith("image")) {
    return notify({
      type: "error",
      title: translate("need-images-file")
    });
  }
  img.value = file;
};
const dropImg = (ev: DragEvent) => {
  dragIn.value = false;
  let file: File | null;

  if (ev.dataTransfer?.items) {
    const item = ev.dataTransfer.items[0];
    if (item.kind === "file") {
      file = item.getAsFile()!;
    } else {
      file = null;
    }
  } else {
    file = ev.dataTransfer!.files[0];
  }
  if (!file) {
    return notify({
      type: "warn",
      title: translate("no-image-selected")
    });
  }
  if (!file.type.startsWith("image")) {
    return notify({
      type: "error",
      title: translate("need-images-file")
    });
  }
  img.value = file;
};
const onPaste = (event: ClipboardEvent) => {
  const items = event.clipboardData && event.clipboardData.items;
  let file: File | null = null;
  if (items && items.length) {
    for (let i = 0; i < items.length; i += 1) {
      if (items[i].type.includes("image")) {
        file = items[i].getAsFile();
        break;
      }
    }
  }
  if (file) {
    img.value = file;
  }
};

watch(img, (img) => {
  if (img) {
    const reader = new FileReader();
    reader.readAsDataURL(img);
    reader.onloadend = (e) => {
      imgUrl.value = e.target?.result;
    };
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
      resultUrl.value = res.data.data.url;
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
    formData.append("token", smmsToken.value);
    formData.append("tinyPngToken", tinyPngToken.value);
    formData.append("file", img.value);
    const res = await axios({
      url: "/api/smms/upload",
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

onMounted(async () => {
  const ClipboardJS = clipboard || (await import("clipboard")).default;
  clipboard = new ClipboardJS(resultInput.value!, {
    target: function (trigger: HTMLElement) {
      return trigger;
    }
  }).on("success", () => {
    notify({
      title: translate("copy-successful")
    });
  });
  document.addEventListener("paste", onPaste);
});

onUnmounted(() => {
  clipboard?.destroy();
  document.removeEventListener("paste", onPaste);
});
</script>

<template>
  <common-modal
    v-model="show"
    wrap-class="upload-image"
    :show-ok="false"
    :show-cancel="false"
    @update:model-value="show = $event"
  >
    <template #title>
      {{ $t('upload-image') }}&nbsp;
      <a
        class="underline"
        target="_blank"
        href="https://doc.sm.ms/"
      >sm.ms
        <Info class="inline-block size-4" /></a>
      &
      <a
        class="underline"
        target="_blank"
        href="https://tinypng.com/developers"
      >tinypng
        <Info class="inline-block size-4" /></a>
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
          @drop.prevent="dropImg"
        >
          <input
            type="file"
            accept="image/*"
            class="hidden"
            @change="setImage"
          >
          <div
            v-if="!img"
            class="flex flex-col items-center gap-1"
          >
            <Plus class="size-8" />
            <span>{{ $t('select-image') }}</span>
          </div>
          <img
            v-else
            class="size-full object-contain"
            :src="imgUrl"
          >
        </label>
        <div class="flex flex-col gap-2">
          <div class="flex items-center">
            <input
              v-model="smmsToken"
              class="grow"
              :placeholder="$t('please-input') + ' smms API token'"
            >
            <button
              class="ml-2 text-primary-600"
              :title="$t('save')"
              @click="saveToken('smms-token', smmsToken)"
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
            :disabled="!img || !smmsToken"
            class="mt-2 self-center"
            @click="doUpload"
          >
            {{ $t('upload') }}
          </CommonButton>
        </div>
      </div>
    </template>
  </common-modal>
</template>
