<script setup lang="ts">
import { AlertCircle, Home, RefreshCw } from "lucide-vue-next";
import type { NuxtError } from "#app";

defineProps<{
  error: NuxtError;
}>();

const reload = () => window.location.reload();
</script>

<template>
  <div class="mx-auto flex min-h-screen max-w-2xl flex-col items-stretch">
    <div class="mt-6 overflow-hidden rounded-lg bg-white shadow-lg dark:bg-gray-800">
      <div class="border-b border-red-100 bg-red-50 p-6 dark:border-red-900/30 dark:bg-red-900/20">
        <div class="flex items-center space-x-3">
          <div class="shrink-0 rounded-full bg-red-100 p-2 dark:bg-red-800/50">
            <AlertCircle class="size-6 text-red-600 dark:text-red-400" />
          </div>
          <div>
            <h1 class="text-lg font-semibold text-red-700 dark:text-red-400">
              {{ $t('error-title') }}
            </h1>
            <p class="text-sm text-red-600 dark:text-red-300">
              {{ $t('error-subtitle') }}
            </p>
          </div>
        </div>
      </div>

      <div class="space-y-6 p-6">
        <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ $t('error-status-code') }}
            </div>
            <div class="mt-1 text-2xl font-semibold">
              {{ error.statusCode }}
            </div>
          </div>

          <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
            <div class="text-sm font-medium text-gray-500 dark:text-gray-400">
              {{ $t('error-type') }}
            </div>
            <div class="mt-1 flex space-x-2">
              <span
                class="inline-flex items-center rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800 dark:bg-yellow-800/50 dark:text-yellow-300"
              >
                {{ error.statusMessage }}
              </span>
            </div>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
          <div class="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ $t('error-data') }}
          </div>
          <div class="max-h-60 overflow-auto rounded-md bg-gray-100 p-3 dark:bg-gray-800">
            <pre class="whitespace-pre-wrap text-xs text-gray-800 dark:text-gray-200">
            {{ error.message }}
          </pre>
          </div>
        </div>

        <div class="rounded-lg bg-gray-50 p-4 dark:bg-gray-700/50">
          <div class="mb-2 text-sm font-medium text-gray-500 dark:text-gray-400">
            {{ $t('error-reason') }}
          </div>
          <div class="max-h-60 overflow-auto rounded-md bg-gray-100 p-3 dark:bg-gray-800">
            <pre class="whitespace-pre-wrap text-xs text-gray-800 dark:text-gray-200">
            {{ error.stack }}
          </pre>
          </div>
        </div>
      </div>

      <div
        class="flex flex-col justify-end space-y-2 border-t border-gray-100 bg-gray-50 px-6 py-4 dark:border-gray-700 dark:bg-gray-800/50 sm:flex-row sm:space-x-2 sm:space-y-0"
      >
        <CommonButton
          :icon="RefreshCw"
          @click="reload"
        >
          {{ $t('error-refresh') }}
        </CommonButton>
        <NuxtLink to="/">
          <CommonButton
            theme="primary"
            :icon="Home"
          >
            {{ $t('error-home') }}
          </CommonButton>

        </NuxtLink>
      </div>
    </div>

    <div class="mb-2 mt-auto text-center text-xs text-gray-500 dark:text-gray-400">
      <p>
        {{ $t('error-contact') }}
        |
        <a
          target="_blank"
          href="https://github.com/yunyuyuan/nuxt3-blog/issues/new"
          class="text-primary-600 hover:underline dark:text-primary-400"
        >
          {{ $t('error-feedback') }}
        </a>。
      </p>
    </div>
  </div>
</template>
