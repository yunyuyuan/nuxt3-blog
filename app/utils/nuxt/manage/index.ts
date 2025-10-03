import { createVNode, render } from "vue";
import type { CommonItem, RecordItem, CommitParamsAddition } from "~/utils/common/types";
import { translate } from "~/utils/nuxt/i18n";
import CommonModal from "~/components/common-modal.vue";
import DiffModal from "~/pages/manage/comps/diff-modal.vue";
import VersionUpdateModal from "~/pages/manage/comps/version-update-modal.vue";
import { escapeNewLine } from "~/utils/common/utils";
import { ModalContainerId } from "~/utils/common/constants";

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
 * commit id 不一致
 */
export function createCommitModal() {
  return new Promise<boolean>((resolve) => {
    const container = document.createElement("div");
    const vm = createVNode(CommonModal, {
      modelValue: true,
      modalTitle: translate("warning"),
      modalContent: translate("commit-id-not-correct-confirm")
    });
    vm.props!.onOk = () => {
      render(null, container);
      resolve(true);
    };
    vm.props!.onClose = () => {
      render(null, container);
      resolve(false);
    };
    vm.appContext = useNuxtApp().vueApp._context;
    render(vm, container);
    document
      .getElementById(ModalContainerId)!
      .appendChild(container.firstElementChild!);
  });
}

/**
 * 显示 diff 弹窗确认更改
 */
export function createDiffModal({
  additions,
  deletions,
  showOk = true
}: {
  additions?: CommitParamsAddition[];
  deletions?: Array<{ path: string }>;
  showOk?: boolean;
}) {
  return new Promise<boolean>((resolve) => {
    const container = document.createElement("div");
    const vm = createVNode(DiffModal, {
      modelValue: true,
      additions,
      deletions,
      showOk
    });
    vm.props!.onOk = () => {
      render(null, container);
      resolve(true);
    };
    vm.props!.onClose = () => {
      render(null, container);
      resolve(false);
    };
    vm.appContext = useNuxtApp().vueApp._context;
    render(vm, container);
    document
      .getElementById(ModalContainerId)!
      .appendChild(container.firstElementChild!);
  });
}

/**
 * 显示新版本提示弹窗
 */
export function createVersionUpdateModal(newVersion: string) {
  return new Promise<void>((resolve) => {
    const container = document.createElement("div");
    const vm = createVNode(VersionUpdateModal, {
      modelValue: true,
      newVersion
    });
    vm.props!.onClose = () => {
      render(null, container);
      resolve();
    };
    vm.appContext = useNuxtApp().vueApp._context;
    render(vm, container);
    document
      .getElementById(ModalContainerId)!
      .appendChild(container.firstElementChild!);
  });
}
