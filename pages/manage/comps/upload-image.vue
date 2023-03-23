<script setup lang="ts">
import axios from "axios";
import FormData from "form-data";
import { getLocalStorage, setLocalStorage, notify, translate, isDev, devHotListen } from "~/utils/nuxt";
import { uploadImageEvent } from "~/vite-plugins/types";

const props = defineProps({
  modelValue: Boolean
});

const show = ref(false);
watch(() => props.modelValue, (v) => {
  show.value = v;
});

const emit = defineEmits(["confirm", "cancel", "update:modelValue"]);

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

const doUpload = () => {
  uploading.value = true;
  if (!isDev) {
    const formData = new FormData();
    formData.append("token", smmsToken.value);
    formData.append("tinyPngToken", tinyPngToken.value);
    formData.append("file", img.value);
    axios({
      url: `https://${window.location.host}/api/smms/upload`,
      method: "post",
      data: formData
    }).then(res => afterUpload(res)).catch(err => afterUpload(err));
  } else {
    const reader = new FileReader();
    reader.readAsDataURL(img.value!);
    reader.onload = (event) => {
      import.meta.hot!.send(uploadImageEvent, {
        token: smmsToken.value,
        tinyPngToken: tinyPngToken.value,
        file: event.target!.result,
        filename: img.value!.name
      });
    };
  }
};

devHotListen(uploadImageEvent, afterUpload);

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
});

onUnmounted(() => {
  clipboard?.destroy();
});
</script>

<template>
  <common-modal
    v-model="show"
    wrap-class="upload-image"
    :show-ok="false"
    :show-cancel="false"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <template #title>
      {{ $t('upload-image') }}&nbsp;Supported by
      <a target="_blank" href="https://doc.sm.ms/">sm.ms</a>
      <svg-icon name="question" />
      &
      <a target="_blank" href="https://tinypng.com/developers">tinypng</a>
      <svg-icon name="question" />
    </template>
    <template #body>
      <div class="flexc">
        <div class="result flex">
          <span>{{ $t('upload-result') }}: </span>
          <input ref="resultInput" v-model="resultUrl" :placeholder="$t('no-result')" readonly>
        </div>
        <label
          class="flex"
          :class="{ dragin: dragIn }"
          @dragleave="dragIn = false"
          @dragenter.prevent
          @dragover.prevent="!dragIn && (dragIn = true)"
          @drop.prevent="dropImg"
        >
          <input type="file" accept="image/*" @change="setImage">
          <div v-if="dragIn" class="cover" />
          <div v-if="!img" class="flexc">
            <svg-icon name="add" />
            <span>{{ $t('select-image') }}</span>
          </div>
          <img v-else class="s100" :src="imgUrl">
        </label>
        <div class="flexc footer">
          <div class="flex">
            <input v-model="smmsToken" :placeholder="$t('please-input') + ' smms API token'">
            <span @click="saveToken('smms-token', smmsToken)">
              <svg-icon name="yes" />
            </span>
          </div>
          <div class="flex">
            <input v-model="tinyPngToken" :placeholder="`(${$t('optional')})${$t('please-input')} tinyPng API token`">
            <span @click="saveToken('tinypng-token', tinyPngToken)">
              <svg-icon name="yes" />
            </span>
          </div>
          <common-button icon="upload" :loading="uploading" :disabled="!img || !smmsToken" @click="doUpload">
            {{ $t('upload') }}
          </common-button>
        </div>
      </div>
    </template>
  </common-modal>
</template>

<style lang="scss">
.upload-image {
  .modal-title {
    a {
      color: $theme-color;
      font-size: f-size();
    }

    svg {
      margin-left: 4px;
      fill: $theme-color;

      @include square(12px);
    }
  }

  .modal-body > div {
    justify-content: center;

    .result {
      span {
        font-size: f-size(0.75);
      }

      input {
        padding: 4px;
        width: 220px;
      }

      margin-bottom: 10px;
    }

    label {
      border-radius: 8px;
      border: 1px dashed rgb(179 179 179);
      justify-content: center;
      cursor: pointer;
      transition: $common-transition;
      height: 200px;
      width: 300px;
      margin-bottom: 20px;
      background: rgb(240 240 240);

      @include dark-mode {
        background: rgb(47 47 47);
      }

      &:hover {
        border-color: rgb(59 59 59);
      }

      &.dragin {
        background: rgb(228 228 228);
      }

      input {
        display: none;
      }

      svg {
        fill: $theme-color;

        @include square(80px);
      }

      img {
        object-fit: contain;
      }

      span {
        margin-top: 10px;
        font-size: f-size(0.75);
        color: grey;
      }
    }

    .footer {
      > div {
        margin-bottom: 8px;

        > span {
          cursor: pointer;
          width: 20px;
          height: 20px;

          svg {
            @include square;

            fill: $theme-color-darken;
          }
        }
      }

      input {
        font-size: f-size(0.75);
        width: 300px;
        padding: 6px;
        margin-right: 5px;
      }
    }
  }
}
</style>
