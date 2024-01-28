<script setup lang="ts">
import type { PropType } from "vue";
import { type NotifyType } from "~/utils/nuxt";

defineProps({
  type: { type: String as PropType<NotifyType>, default: "success" },
  title: { type: String, required: true },
  description: { type: String, default: "" }
});
const emit = defineEmits(["destroy"]);

const visible = ref<boolean>(false);

function clickClose () {
  visible.value = false;
}

function animationend () {
  emit("destroy");
}

onMounted(() => {
  visible.value = true;
});
</script>

<template>
  <transition name="wipe" @after-leave="animationend">
    <div v-show="visible" class="notification" :class="type">
      <b v-if="title" :class="{ 'not-content': !description }">{{ title }}</b>
      <span>{{ description }}</span>
      <a @click="clickClose">
        <svg-icon name="close" />
      </a>
      <del @animationend="clickClose" />
    </div>
  </transition>
</template>

<style lang="scss">
#_NOTIFICATION_CONTAINER_ {
  position: fixed;
  z-index: $z-index-notify;
  overflow: visible;
  top: 0;
  right: 0;
  left: 0;
  height: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  color: black;

  .notification {
    flex-shrink: 0;
    position: relative;
    top: 0;
    min-width: 240px;
    max-width: 480px;
    border-radius: 5px;
    box-shadow: 0 0 8px rgb(0 0 0 / 60%);
    background: white;
    padding: 12px 50px 12px 15px;
    overflow: hidden;
    margin-top: 20px;

    &.wipe-enter-active {
      animation: fade-in 0.15s ease-out;
    }

    &.wipe-leave-active {
      animation: fade-in reverse 0.15s ease-out;
    }

    &.success {
      background: linear-gradient(90deg, #f0ffef, #fff);

      a {
        background: #a1ffc3;

        &:hover {
          background: #7dffaa;
        }
      }
    }

    &.error {
      background: linear-gradient(90deg, #ffefef, #fff);
    }

    &.warn {
      background: linear-gradient(90deg, #fff7ef, #fff);

      a {
        background: #ffbc95;

        &:hover {
          background: #ffa46d;
        }
      }
    }

    b {
      display: block;
      font-size: f-size(0.85);
      word-break: keep-all;
      margin-bottom: 6px;

      &.not-content {
        margin-bottom: 0;
      }
    }

    span {
      white-space: break-spaces;
      font-size: f-size(0.75);
    }

    del {
      position: absolute;
      height: 1px;
      background: black;
      left: 0;
      bottom: 0;
    }

    &.wipe-enter-active,
    &.wipe-leave-active {
      del {
        opacity: 0;
      }
    }

    &:not(.wipe-enter-active, .wipe-leave-active) {
      del {
        animation: timer-decrement 3s linear;
      }

      &:hover {
        del {
          animation-play-state: paused;
        }
      }
    }

    @keyframes timer-decrement {
      0% {
        width: 100%;
      }

      100% {
        width: 0;
      }
    }

    a {
      position: absolute;
      right: 0;
      top: 0;
      height: 100%;
      width: 30px;
      background: #ffb1b1;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: $common-transition;
      box-shadow: 0 0 5px rgb(0 0 0 / 18%);

      &:hover {
        background: #ff8484;
      }

      svg {
        @include square(10px);

        fill: black;
      }
    }
  }

  @keyframes fade-in {
    0% {
      transform: translateY(-100%);
      opacity: 0.2;
    }

    100% {
      transform: translateY(0);
      opacity: 1;
    }
  }
}

@include mobile {
  #_NOTIFICATION_CONTAINER_ {
    .notification {
      min-width: 50%;
      max-width: calc(95% - 65px);
    }
  }
}
</style>
