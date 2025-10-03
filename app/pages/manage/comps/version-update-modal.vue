<script setup lang="ts">
import { CircleFadingArrowUp, ExternalLink, ScrollText, Sparkles } from "lucide-vue-next";
import config from "~~/config";
import { OfficialRepo } from "~/utils/common/constants";

const show = defineModel<boolean>({ required: true });

defineProps<{
  newVersion: string;
  onClose: () => void;
}>();

const changelogUrl = `https://github.com/${OfficialRepo}/blob/master/CHANGELOG.md`;
const repoUrl = `https://github.com/${config.githubName}/nuxt3-blog`;
</script>

<template>
  <common-modal
    v-model="show"
    modal-width="800px"
    :show-ok="false"
    :show-cancel="false"
    @cancel="onClose"
  >
    <template #title>
      {{ $t('new-version-available') }}
    </template>
    <template #body>
      <div class="space-y-6">
        <div class="rounded-lg bg-blue-50 p-4 dark:bg-blue-900/20">
          <p class="flex items-center gap-2 text-dark-900 dark:text-dark-100">
            <Sparkles class="size-5 text-primary-600" />
            {{ $t('new-version-detected', [newVersion]) }}
          </p>
        </div>

        <div>
          <h4 class="mb-2 flex items-center gap-2 font-medium text-dark-900 dark:text-white">
            <ScrollText class="size-5" />
            {{ $t('view-changelog') }}
          </h4>
          <a
            :href="changelogUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
          >
            <span>CHANGELOG.md</span>
            <ExternalLink class="size-4" />
          </a>
        </div>

        <div>
          <h4 class="mb-2 flex items-center gap-2 font-medium text-dark-900 dark:text-white">
            <CircleFadingArrowUp class="size-5" />
            {{ $t('how-to-upgrade') }}
          </h4>
          <ol class="mb-5 list-decimal space-y-2 pl-5 text-dark-700 dark:text-dark-300">
            <li>
              {{ $t('upgrade-step-1') }}
              <a
                :href="repoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex items-center gap-1 text-blue-600 hover:text-blue-700 hover:underline dark:text-blue-400 dark:hover:text-blue-300"
              >
                <span>{{ repoUrl }}</span>
                <ExternalLink class="size-3" />
              </a>
            </li>
            <li>{{ $t('upgrade-step-2') }}</li>
          </ol>
          <div class="m-2 overflow-hidden rounded-lg border border-dark-200 dark:border-dark-700">
            <img
              src="/how-to-upgrade.png"
              alt="How to upgrade"
              class="w-full"
            >
          </div>
        </div>
      </div>
    </template>
  </common-modal>
</template>
