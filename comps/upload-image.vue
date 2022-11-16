<script setup lang="ts">
import axios from "axios";
import FormData from "form-data";
import { notify } from "~/utils/notify/notify";
import { getLocalStorage, setLocalStorage } from "~/utils/utils";

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
  const file = (e.target as HTMLInputElement).files[0];
  if (!file.type.startsWith("image")) {
    return notify({
      type: "error",
      title: "请选择图片文件"
    });
  }
  img.value = file;
};
const dropImg = (ev: DragEvent) => {
  let file: File;

  if (ev.dataTransfer.items) {
    const item = ev.dataTransfer.items[0];
    if (item.kind === "file") {
      file = item.getAsFile();
    }
  } else {
    file = ev.dataTransfer.files[0];
  }
  if (!file) {
    return notify({
      type: "warn",
      title: "未选择图片"
    });
  }
  if (!file.type.startsWith("image")) {
    return notify({
      type: "error",
      title: "请选择图片文件"
    });
  }
  img.value = file;
};
watch(img, (img) => {
  if (img) {
    const reader = new FileReader();
    reader.readAsDataURL(img);
    reader.onloadend = (e) => {
      imgUrl.value = e.target.result;
    };
  }
});

const doUpload = async () => {
  uploading.value = true;
  const formData = new FormData();
  formData.append("token", smmsToken.value);
  formData.append("tinyPngToken", tinyPngToken.value);
  formData.append("file", img.value);
  try {
    const res = await axios({
      url: `https://${window.location.host}/api/smms/upload`,
      method: "post",
      data: formData
    });
    if (res.data.success) {
      resultUrl.value = res.data.data.url;
      notify({
        title: "上传成功",
        description: "请手动复制图片链接"
      });
      setLocalStorage("smms-token", smmsToken.value);
      if (tinyPngToken.value) {
        setLocalStorage("tinypng-token", tinyPngToken.value);
      }
    } else {
      throw new Error(res.data.message);
    }
  } catch (e) {
    notify({
      type: "error",
      title: "上传失败",
      description: e.toString()
    });
  } finally {
    uploading.value = false;
  }
};

const resultInput = ref<HTMLInputElement>();
let clipboard = null;

onMounted(async () => {
  const ClipboardJS = clipboard || (await import("clipboard")).default;
  clipboard = new ClipboardJS(resultInput.value, {
    target: function (trigger) {
      return trigger;
    }
  }).on("success", () => {
    notify({
      title: "复制成功！"
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
      上传图片&nbsp;Support by
      <a style="font-size: 14px;" target="_blank" href="https://doc.sm.ms/">sm.ms</a>
      <svg-icon name="question" />
      &
      <a style="font-size: 14px;" target="_blank" href="https://tinypng.com/developers">tinypng</a>
      <svg-icon name="question" />
    </template>
    <template #body>
      <div class="flexc">
        <div class="result flex">
          <span>上传结果：</span>
          <input ref="resultInput" v-model="resultUrl" placeholder="暂无" readonly>
        </div>
        <label
          class="flex"
          :class="{dragin: dragIn}"
          @dragleave="dragIn = false"
          @dragenter.prevent
          @dragover.prevent="!dragIn && (dragIn = true)"
          @drop.prevent="dropImg"
        >
          <input type="file" accept="image/*" @change="setImage">
          <div v-if="dragIn" class="cover" />
          <div v-if="!img" class="flexc">
            <svg-icon name="add" />
            <span>选择文件/拖拽图片到此</span>
          </div>
          <img v-else class="s100" :src="imgUrl">
        </label>
        <div class="flexc footer">
          <input v-model="smmsToken" placeholder="请输入smms API token">
          <input v-model="tinyPngToken" placeholder="(可选)请输入tinyPng API token">
          <common-button icon="upload" :loading="uploading" :disabled="!img || !smmsToken" @click="doUpload">
            上传
          </common-button>
        </div>
      </div>
    </template>
  </common-modal>
</template>

<style lang="scss">
@import "assets/style/var";

.upload-image {
  .modal-title {
    a {
      color: $theme-color;
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
        font-size: 13px;
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
        font-size: 13px;
        color: grey;
      }
    }

    .footer {
      input {
        font-size: 13px;
        width: 300px;
        padding: 6px;
        margin-right: 5px;
        margin-bottom: 8px;
      }
    }
  }
}
</style>
