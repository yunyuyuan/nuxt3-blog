<script setup lang="ts">
import { ArrowLeft } from "lucide-vue-next";
import { useCommonSEOTitle } from "~/utils/nuxt/utils";
import bg from "~/assets/image/outerwilds.jpg";
import config from "~/config";
import { translate } from "~/utils/nuxt/i18n";

definePageMeta({
  layout: "blank"
});

useCommonSEOTitle(computed(() => translate("about")));

const commitSha = __NB_CURRENT_GIT_SHA__;
const commitUrl = computed(() => `https://github.com/${config.githubName}/${config.githubRepo}/commit/${commitSha}`);
const buildTime = __NB_BUILD_TIME__;

const paragraphs = config.about;
</script>

<template>
  <div class="fixed inset-0 z-0">
    <div class="absolute inset-0 z-10 bg-gradient-to-b from-black/60 to-black/30" />
    <img
      :src="bg"
      alt="background"
      class="size-full object-cover object-right"
    >
  </div>

  <div class="fixed left-6 top-6 z-50 max-md:left-2">
    <NuxtLink
      to="/"
      class="flex items-center space-x-2 text-white transition hover:text-primary-300"
    >
      <ArrowLeft class="size-5" />
      <span>{{ $t('back-home') }}</span>
    </NuxtLink>
  </div>

  <main class="relative z-20 flex min-h-screen flex-col items-center justify-center px-4 py-16 max-md:px-2">
    <div class="w-full max-w-2xl rounded-2xl bg-dark-100/60 p-8 shadow-xl backdrop-blur-md max-md:p-12">
      <div class="space-y-4 text-center text-dark-950">
        <p
          v-for="p, idx in paragraphs"
          :key="idx"
        >
          {{ p }}
        </p>
      </div>
    </div>
  </main>

  <footer class="absolute bottom-0 left-0 z-20 w-full py-3">
    <div class="container mx-auto px-4 text-center">
      <p class="text-sm text-white/70">
        Last built &lt;<a
          target="_blank"
          :href="commitUrl"
          class="text-primary-300 transition hover:text-primary-500"
        >{{ commitSha.substring(0, 8) }}</a>&gt; succeeded at
        <time>{{ buildTime }}</time>
      </p>
    </div>
  </footer>
</template>
