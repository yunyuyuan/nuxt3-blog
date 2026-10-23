import type { CommonItem, RecordItem } from "#layers/nuxt-blog/app/utils/common/types";
import { translate } from "#layers/nuxt-blog/app/utils/nuxt/i18n";
import DiffModal from "#layers/nuxt-blog/app/pages/manage/comps/diff-modal.vue";
import VersionUpdateModal from "#layers/nuxt-blog/app/pages/manage/comps/version-update-modal.vue";
import { escapeNewLine } from "#layers/nuxt-blog/app/utils/common/utils";
import { openModal } from "#layers/nuxt-blog/app/utils/nuxt/modal";

export function randomId(exist: CommonItem[] = []) {
  const ids = exist.map(item => item.id);
  let len = ids.length ? Math.max(...ids).toString().length : 8;
  if (ids.length > 10 ** (len - 1) * 0.6) {
    len += 1;
  }
  while (true) {
    let id: string | number = "";
    for (let i = 0; i < len; i++) {
      id += Math.floor(
        i ? Math.random() * 10 : Math.random() * 9 + 1
      ).toString();
    }
    id = parseInt(id);
    if (!ids.includes(id)) {
      return id;
    }
  }
}

export function useStatusText(modifiedRef?: Readonly<Ref<boolean>>, decryptedRef?: Readonly<Ref<boolean>>) {
  const processing = ref(false);
  const toggleProcessing = () => {
    processing.value = !processing.value;
  };

  const canCommit = computed(() => Boolean(useGithubToken().value));

  const statusText = computed((): string => {
    if (!canCommit.value) {
      return translate("please-input-token-first");
    }

    if (decryptedRef && !decryptedRef.value) {
      return translate("need-decrypt");
    }

    return (!modifiedRef || modifiedRef.value)
      ? (processing.value ? translate("performing-request") : "")
      : translate("not-modified");
  });
  return { toggleProcessing, processing, statusText, canCommit };
}

export function compareItem<T extends CommonItem>(item1: T, item2: T) {
  const keys = Object.keys(item1) as (keyof T)[];
  let diff = false;
  for (const k of keys) {
    if (k === "time" || k === "modifyTime") {
      continue;
    }
    const value1 = item1[k];
    const value2 = item2[k];
    if (k === "images") {
      if (JSON.stringify((value1 as RecordItem["images"]).map(img => ({ ...img, id: 0 })))
        !== JSON.stringify((value2 as RecordItem["images"]).map(img => ({ ...img, id: 0 })))) {
        diff = true;
      }
    } else if (typeof value1 === "object") {
      if (JSON.stringify(value1) !== JSON.stringify(value2)) {
        diff = true;
      }
    } else if (value1 !== value2) {
      diff = true;
    }
  }
  return !diff;
}
/**
 * 比较markdown
 */
export function compareMd(s1: string, s2: string) {
  return escapeNewLine(s1).trim() === escapeNewLine(s2).trim();
}

/**
 * 显示 diff 弹窗确认更改：确定返回 true，关闭返回 false
 */
export function createDiffModal({
  rawDiff,
  additions,
  deletions,
  showOk = true
}: Pick<InstanceType<typeof DiffModal>["$props"], "additions" | "deletions" | "showOk" | "rawDiff">) {
  return openModal<boolean>(DiffModal, { rawDiff, additions, deletions, showOk }, { onOk: true }, false);
}
/**
 * 显示新版本提示弹窗，关闭后 resolve
 */
export function createVersionUpdateModal(newVersion: string) {
  return openModal<undefined>(VersionUpdateModal, { newVersion }, {}, undefined);
}
