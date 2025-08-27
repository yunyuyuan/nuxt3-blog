<script setup lang="ts">
import { AlertCircle, AlertTriangle, CheckCircle, X } from "lucide-vue-next";
import type { NotifyType } from "~/utils/nuxt/notify";

withDefaults(defineProps<{
  type?: NotifyType;
  title: string;
  description?: string;
}>(), {
  type: "success",
  description: ""
});
const emit = defineEmits(["destroy"]);

const visible = ref<boolean>(false);

function clickClose() {
  visible.value = false;
}

function animationend() {
  emit("destroy");
}

onMounted(() => {
  visible.value = true;
  setTimeout(() => {
    visible.value = false;
  }, 4000);
});
</script>

<template>
  <transition
    name="wipe"
    @after-leave="animationend"
  >
    <div
      v-show="visible"
      :class="twMerge(
        $style.notification,
        type === 'success' && 'border-green-500',
        type === 'error' && 'border-red-500',
        type === 'warn' && 'border-yellow-500'
      )"
    >
      <div class="flex items-start gap-2 px-4 py-3">
        <div class="shrink-0">
          <CheckCircle
            v-if="type === 'success'"
            class="size-5 text-green-500"
          />
          <AlertTriangle
            v-else-if="type === 'warn'"
            class="size-5 text-yellow-500"
          />
          <AlertCircle
            v-else-if="type === 'error'"
            class="size-5 text-red-500"
          />
        </div>
        <div class="ml-3 flex-1">
          <p
            v-if="title"
            class="text-sm font-medium text-dark-900 dark:text-white"
          >
            {{ title }}
          </p>
          <p
            v-if="description"
            class="mt-1 text-sm text-dark-500 dark:text-dark-400"
          >
            {{ description }}
          </p>
        </div>
        <div class="ml-4 flex shrink-0">
          <button
            class="inline-flex text-dark-400 hover:text-dark-500 dark:hover:text-dark-300"
            @click="clickClose"
          >
            <X
              class="size-4"
            />
          </button>
        </div>
      </div>
    </div>
  </transition>
</template>

<style module>
:global(#_NOTIFICATION_CONTAINER_) {
  @apply fixed overflow-visible inset-x-0 top-0 h-0 flex flex-col items-center;
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

.notification {
  @apply relative top-0 shrink-0 min-w-[240px] max-w-[480px] mt-5 rounded-lg border-l-4 bg-white transition shadow-lg dark:bg-dark-800;
  @apply max-md:min-w-[50%] max-md:max-w-[calc(95%_-_65px)];

  &:global(.wipe-enter-active) {
    animation: fade-in 0.15s ease-out;
  }

  &:global(.wipe-leave-active) {
    animation: fade-in reverse 0.15s ease-out;
  }
}
</style>
