import { createVNode, render } from "vue";
import { type CommonItem, ModalContainerId, escapeNewLine, type RecordItem } from "~/utils/common";
import { translate, translateT } from "~/utils/nuxt";
import CommonModal from "~/components/common-modal.vue";

export function randomId (exist: CommonItem[] = []) {
  const ids = exist.map(item => item.id);
  let len = ids.length ? Math.max(...ids).toString().length : 4;
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

export function useStatusText (modifiedRef?: Readonly<Ref<boolean>>, decryptedRef?: Readonly<Ref<boolean>>) {
  const processing = ref(false);
  const toggleProcessing = () => {
    processing.value = !processing.value;
  };

  const canCommit = computed(() => Boolean(useGithubToken().value));

  const statusText = computed((): string => {
    if (!canCommit.value) {
      return translate("please-input-token-first");
    }

    if (decryptedRef?.value) {
      return translate("need-decrypt");
    }

    return (!modifiedRef || modifiedRef.value) ? 
      (processing.value ? translate("performing-request") : "")
      : translate("not-modified");
  });
  return { toggleProcessing, processing, statusText, canCommit };
}

export function compareItem<T extends CommonItem>(item1: T, item2: T) {
  const keys = Object.keys(item1) as (keyof T)[];
  let diff = false;
  for (const k of keys) {
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
export function compareMd (s1: string, s2: string) {
  return escapeNewLine(s1).trim() === escapeNewLine(s2).trim();
}

/**
 * commit id 不一致
 */
export function createCommitModal () {
  return new Promise<boolean>((resolve) => {
    const container = document.createElement("div");
    const vm = createVNode(CommonModal, {
      modelValue: true,
      modalTitle: translateT("warning"),
      modalContent: translate("commit-id-not-correct-confirm"),
      testId: "force-commit-confirm"
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
