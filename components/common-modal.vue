<script setup lang="ts">
import { PropType } from "vue";
import { ModalContainerId } from "~/utils/constants";

defineProps({
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
  }
});

const root = ref<HTMLElement>();
const emit = defineEmits(["confirm", "cancel", "update:modelValue"]);

const setFocus = () => {
  root.value.focus();
};
const close = () => {
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
          @keyup.enter="emit('confirm')"
          @keyup.escape="close"
        >
          <div class="bg" @click.self="maskClosable ? close() : null" />
          <div class="inner" :style="`width: ${modalWidth}px`">
            <div class="modal-title flex">
              <h3>
                <slot name="title" />
              </h3>
              <a class="flex modal-close" @click="close">
                <svg-icon name="close" />
              </a>
            </div>
            <div class="modal-body">
              <slot name="body" />
            </div>
            <div v-if="showOk || showCancel" class="modal-foot flex">
              <common-button
                v-if="showOk"
                class="ok"
                :loading="loading"
                :theme="confirmTheme"
                @click="emit('confirm')"
              >
                确定
              </common-button>
              <common-button v-if="showCancel" theme="default" @click="close">
                取消
              </common-button>
            </div>
          </div>
        </div>
      </transition>
    </teleport>
  </client-only>
</template>

<style lang="scss">
@import "assets/style/var";

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
    z-index: 1;
  }

  > .inner {
    z-index: 2;
    background: white;
    border-radius: 6px;
    margin: auto;
    padding: 18px 32px 22px;
    position: relative;
    margin-top: 128px;
    box-shadow: 0 0 20px rgb(0 0 0 / 30%);
    transition: $common-transition;

    > .modal-title {
      padding: 0 0 14px;
      height: 32px;
      border-bottom: 1px solid #e1e1e1;
      color: rgb(55 55 55);

      > .modal-close {
        position: absolute;
        cursor: pointer;
        top: 23px;
        right: 28px;
        transition: $common-transition;
        border-radius: 3px;

        @include square(24px);

        background: white;
        justify-content: center;

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
    }

    > .modal-body {
      margin: 20px 0;
      max-height: calc(100vh - 360px);
      overflow: auto;
    }

    > .modal-foot {
      justify-content: flex-end;

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
    }
  }
}

@media screen and (max-height: 480px) {
  .common-modal {
    >.inner {
      margin-top: 12px;
    }
  }
}
</style>
