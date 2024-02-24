<script setup lang="ts">
import type { PropType } from "vue";
import { ModalContainerId } from "~/utils/common";

const props = defineProps({
  confirmTheme: {
    type: String as PropType<"primary" | "danger">,
    default: "primary"
  },
  modelValue: Boolean,
  loading: Boolean,
  wrapClass: {
    type: String,
    default: ""
  },
  showOk: {
    type: Boolean,
    default: true
  },
  showCancel: {
    type: Boolean,
    default: true
  },
  maskClosable: {
    type: Boolean,
    default: true
  },
  modalWidth: {
    type: String,
    default: "500"
  },
  modalTitle: {
    type: String,
    default: undefined
  },
  modalContent: {
    type: String,
    default: undefined
  },
  onCancel_: {
    type: Function,
    default: undefined
  },
  onOk: {
    type: Function,
    default: undefined
  }
});

const root = ref<HTMLElement>();
const emit = defineEmits(["confirm", "cancel", "update:modelValue"]);

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
  if (props.onCancel_) {
    return props.onCancel_();
  }
  emit("cancel");
  emit("update:modelValue", false);
};
</script>

<template>
  <client-only>
    <teleport :to="`#${ModalContainerId}`">
      <transition name="modal" @after-enter="setFocus">
        <div
          v-show="modelValue"
          ref="root"
          role="document"
          tabindex="1"
          class="common-modal"
          :class="wrapClass"
          @keyup.enter="ok"
          @keyup.escape="close"
        >
          <div class="bg" @click.self="maskClosable ? close() : null" />
          <div class="inner flexc" :style="`width: ${modalWidth}px`">
            <div class="modal-title flex">
              <h3>
                <template v-if="modalTitle">
                  {{ modalTitle }}
                </template>
                <slot v-else name="title" />
              </h3>
            </div>
            <a class="flex modal-close" @click="close">
              <svg-icon name="close" />
            </a>
            <div class="modal-body">
              <p v-if="modalContent">
                {{ modalContent }}
              </p>
              <slot name="body" />
            </div>
            <div v-if="showOk || showCancel" class="modal-foot flex">
              <common-button
                v-if="showOk"
                class="ok"
                :loading="loading"
                :theme="confirmTheme"
                @click="ok"
              >
                {{ $TT('ok') }}
              </common-button>
              <common-button v-if="showCancel" theme="default" @click="close">
                {{ $T('cancel') }}
              </common-button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </client-only>
</template>

<style lang="scss">
.common-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  outline: none;
  z-index: $z-index-modal;
  transition: $common-transition;
  opacity: 1;

  &.modal-enter-from,
  &.modal-leave-to {
    opacity: 0;

    > .inner {
      transform: translateY(-30px);
    }
  }

  > .bg {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgb(0 0 0 / 35%);

    @include dark-mode {
      background: rgb(0 0 0 / 50%);
    }

    z-index: 1;
  }

  > .inner {
    z-index: 2;
    background: white;

    @include dark-mode {
      background: $background-dark;
    }

    border-radius: 6px;
    margin: auto;
    padding: 18px 32px;
    position: relative;
    margin-top: 128px;
    box-shadow: 0 0 20px rgb(0 0 0 / 30%);
    transition: $common-transition;
    align-items: stretch;

    @include dark-mode {
      box-shadow: 0 0 20px rgb(0 0 0 / 60%);
    }

    > .modal-title {
      padding: 0 0 14px;
      height: 32px;
      border-bottom: 1px solid #e1e1e1;
      color: rgb(55 55 55);

      @include dark-mode {
        color: #eee;
      }
    }

    > .modal-close {
      position: absolute;
      cursor: pointer;
      top: 23px;
      right: 32px;
      transition: $common-transition;
      border-radius: 3px;

      @include square(24px);

      background: white;
      justify-content: center;

      @include dark-mode {
        background: transparent;

        > svg {
          fill: white;
        }

        &:hover {
          background: rgb(29 29 29);
        }

        &:active {
          background: rgb(90 90 90);
        }
      }

      &:hover {
        background: rgb(240 240 240);
      }

      &:active {
        background: rgb(221 221 221);

        > svg {
          fill: black;
        }
      }

      > svg {
        @include square(12px);

        fill: #474747;
        transition: $common-transition;
      }
    }

    > .modal-body {
      margin-top: 20px;
      max-height: calc(100vh - 300px);
      overflow: auto;
    }

    > .modal-foot {
      justify-content: flex-end;
      margin-top: 20px;

      > .ok {
        margin-right: 12px;
      }
    }
  }
}

@include mobile {
  .common-modal {
    >.inner {
      width: calc(95% - 32px) !important;
      padding-left: 16px;
      padding-right: 16px;

      > .modal-close {
        right: 16px;
      }
    }
  }
}

@media screen and (max-height: 480px) {
  .common-modal {
    >.inner {
      margin-top: 12px;
      max-height: calc(100vh - 64px);

      > .modal-body {
        max-height: unset;
        height: unset;
      }
    }
  }
}
</style>
