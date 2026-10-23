<script setup lang="ts">
import { Info, Plus, Save, Upload } from "lucide-vue-next";
import ClipboardJS from "clipboard";
import { translate } from "#layers/nuxt3-blog/app/utils/nuxt/i18n";
import { getLocalStorage, rmLocalStorage, setLocalStorage } from "#layers/nuxt3-blog/app/utils/nuxt/localStorage";
import { notify } from "#layers/nuxt3-blog/app/utils/nuxt/notify";
import { watchUntil } from "#layers/nuxt3-blog/app/utils/nuxt/utils";
import { withBase } from "#layers/nuxt3-blog/app/utils/nuxt/with-base";

const show = defineModel<boolean>({ required: true });

type R2Status = { enabled: boolean; serverKey: boolean; maxBytes: number; types: string[] };
const R2SecretKey = "r2-secret-access-key";

const dragIn = ref(false);
const file = ref<File>();
const fileUrl = ref();
const isImage = computed(() => file.value?.type.startsWith("image"));
const isVideo = computed(() => file.value?.type.startsWith("video"));
const r2SecretAccessKey = ref(getLocalStorage(R2SecretKey) || "");
const tinyPngToken = ref(getLocalStorage("tinypng-token") || "");
const resultUrl = ref("");
const uploading = ref(false);

// 运行时探测：纯静态托管没有 /api/r2/status，请求失败或返回的不是 JSON 都视为不可用
const r2Status = ref<R2Status>();
const r2Enabled = computed(() => !!r2Status.value?.enabled);
const serverKey = computed(() => !!r2Status.value?.serverKey);
const githubToken = useGithubToken();

const loadR2Status = async () => {
  try {
    const res = await $fetch<R2Status>(withBase("/api/r2/status"));
    r2Status.value = typeof res === "object" && res ? res : undefined;
  } catch {
    r2Status.value = undefined;
  }
  if (serverKey.value && getLocalStorage(R2SecretKey)) {
    // 服务端已持有密钥，浏览器里的旧密钥不再需要
    rmLocalStorage(R2SecretKey);
    r2SecretAccessKey.value = "";
    notify({ title: translate("r2-local-key-removed") });
  }
};
watch(show, (v) => {
  if (v && !r2Status.value) {
    loadR2Status();
  }
}, { immediate: true });

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

const canUpload = computed(() => !!file.value && r2Enabled.value && (serverKey.value ? !!githubToken.value : !!r2SecretAccessKey.value));

// 与服务端相同的限制，先在浏览器里拦下
const checkFile = (f: File) => {
  const status = r2Status.value!;
  if (!status.types.some(t => f.type.startsWith(t))) {
    return translate("file-type-not-allowed");
  }
  if (f.size > status.maxBytes) {
    return translate("file-too-large", [status.maxBytes / 1024 / 1024]);
  }
};

const doUpload = async () => {
  const invalid = checkFile(file.value!);
  if (invalid) {
    return notify({ type: "warn", title: translate("upload-failed"), description: invalid });
  }
  uploading.value = true;
  try {
    const formData = new FormData();
    if (!serverKey.value) {
      formData.append("secretAccessKey", r2SecretAccessKey.value);
    }
    formData.append("tinyPngToken", tinyPngToken.value);
    formData.append("file", file.value!);
    const res = await $fetch<{ success: boolean; url: string }>(withBase("/api/r2/upload"), {
      method: "POST",
      body: formData,
      headers: serverKey.value ? { Authorization: `Bearer ${githubToken.value}` } : {}
    });
    resultUrl.value = res.url;
    notify({
      title: translate("upload-successful"),
      description: translate("manually-copy-link")
    });
  } catch (e: any) {
    notify({
      type: "error",
      title: translate("upload-failed"),
      description: e?.data?.message || e?.message || String(e)
    });
  } finally {
    uploading.value = false;
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
        href="https://github.com/yunyuyuan/nuxt-blog/wiki/2.2-%E4%B8%8A%E4%BC%A0%E5%9B%BE%E7%89%87"
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
          <small
            v-if="!r2Enabled"
            class="text-red-500"
          >{{ $t('r2-unavailable') }}</small>
          <small v-else-if="serverKey">{{ $t('r2-server-key') }}</small>
          <small
            v-else
            class="text-yellow-600"
          >{{ $t('r2-legacy-key') }}</small>
          <div
            v-if="r2Enabled && !serverKey"
            class="flex items-center"
          >
            <input
              v-model="r2SecretAccessKey"
              type="password"
              class="grow"
              :placeholder="$t('please-input') + ' R2 Secret Access Key'"
            >
            <button
              class="ml-2 text-primary-600"
              :title="$t('save')"
              @click="saveToken(R2SecretKey, r2SecretAccessKey)"
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
            :disabled="!canUpload"
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
