<script setup lang="ts">
import { X } from "lucide-vue-next";
import { ModalContainerId } from "~/utils/common/constants";

const show = defineModel<boolean>({ required: true });

const { getZIndex } = useModalZIndex();
const zIndex = ref(getZIndex());
watch(show, (show) => {
  if (show) {
    zIndex.value = getZIndex();
  }
});

const props = withDefaults(defineProps<{
  confirmTheme?: "primary" | "danger";
  loading?: boolean;
  wrapClass?: string;
  showOk?: boolean;
  showCancel?: boolean;
  maskClosable?: boolean;
  modalWidth?: string;
  modalTitle?: string;
  modalContent?: string;
  onClose?: CallableFunction;
  onOk?: CallableFunction;
  testId?: string;
  okTestId?: string;
  cancelTestId?: string;
}>(), {
  confirmTheme: "primary",
  wrapClass: "",
  showOk: true,
  showCancel: true,
  maskClosable: true,
  modalWidth: "500px",
  modalTitle: undefined,
  modalContent: undefined,
  onClose: undefined,
  onOk: undefined,
  testId: undefined,
  okTestId: undefined,
  cancelTestId: undefined
});

const root = ref<HTMLElement>();
const emit = defineEmits(["confirm", "cancel"]);

const setFocus = () => {
  if (root.value) {
    const focusEl = root.value.querySelector<HTMLElement>("[data-focus]") || root.value;
    focusEl?.focus();
  }
};
const ok = () => {
  if (props.onOk) {
    return props.onOk();
  }
  emit("confirm");
};
const close = () => {
  if (props.onClose) {
    return props.onClose();
  }
  emit("cancel");
  show.value = false;
};
</script>

<template>
  <client-only>
    <teleport :to="`#${ModalContainerId}`">
      <transition
        name="modal"
        @after-enter="setFocus"
      >
        <div
          v-show="show"
          ref="root"
          role="document"
          tabindex="1"
          :class="twMerge($style.modal, wrapClass)"
          :style="`z-index: ${zIndex}`"
          @keyup.enter="ok"
          @keyup.escape="close"
        >
          <div
            :class="$style.bg"
            @click.self="maskClosable ? close() : null"
          />
          <div
            :class="$style.inner"
            :style="`width: ${modalWidth}`"
            :data-testid="testId"
          >
            <div class="flex items-center justify-between border-b border-dark-200 pb-4 dark:border-dark-700">
              <h3 class="text-lg font-medium text-dark-900 dark:text-white">
                <template v-if="modalTitle">
                  {{ modalTitle }}
                </template>
                <slot
                  v-else
                  name="title"
                />
              </h3>
              <button
                class="text-dark-400 hover:text-dark-500 focus:outline-none dark:hover:text-dark-300"
                @click="close"
              >
                <X class="size-5" />
              </button>
            </div>

            <div class="overflow-auto pt-4">
              <p v-if="modalContent">
                {{ modalContent }}
              </p>
              <slot name="body" />
            </div>

            <div
              v-if="showOk || showCancel"
              class="flex justify-end space-x-3 pt-3"
            >
              <CommonButton
                v-if="showOk"
                :loading="loading"
                :theme="confirmTheme"
                :data-testid="okTestId"
                @click="ok"
              >
                {{ $t('ok') }}
              </CommonButton>
              <CommonButton
                v-if="showCancel"
                theme="default"
                :data-testid="cancelTestId"
                @click="close"
              >
                {{ $t('cancel') }}
              </CommonButton>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </client-only>
</template>

<style module>
.modal {
  @apply fixed flex items-center inset-0 outline-none z-modal transition opacity-100 backdrop-blur-sm;

  &:global(.modal-enter-from),
  &:global(.modal-leave-to) {

    @apply opacity-0;

    .inner {
      transform: translateY(-30px);
    }
  }
}

.bg {
  @apply absolute inset-0 bg-dark-700/20 dark:bg-dark-700/50;
}

.inner {
  @apply max-w-[98vw] relative max-md:mt-8 max-h-[calc(100vh_-_160px)] [@media(max-height:600px)]:mt-8 [@media(max-height:600px)]:max-h-[calc(100vh_-_80px)] z-[2] bg-white dark:bg-dark-800 rounded-2xl mx-auto px-8 py-6 max-md:p-4 shadow-md flex flex-col items-stretch transition;
}
</style>
