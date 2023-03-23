<script setup lang="ts">
import { HeaderTabs } from "~/utils/common";
import { calcRocketUrl, useUnlocalePath, isDev } from "~/utils/nuxt";

const emit = defineEmits(["upload-image", "show-verify"]);

const localePath = useLocalePath();
const githubToken = useGithubToken();
const encryptor = useEncryptor();
const allPassed = computed(() => !!githubToken && encryptor.passwdCorrect.value);

const activeRoute = computed(() => {
  return useUnlocalePath().replace(/^\/manage\//, "/");
});
const travel = computed(() => {
  return calcRocketUrl();
});

</script>

<template>
  <div class="manage-menu w100 flexc">
    <ul>
      <li>
        <a class="upload-img-btn" @click="emit('upload-image')">
          {{ $T('images') }}
        </a>
      </li>
      <li>
        <nuxt-link
          :to="localePath('/manage/config')"
          :class="{ active: activeRoute.startsWith('/config') }"
        >
          {{ $T('config') }}
        </nuxt-link>
      </li>
      <li v-for="tab in HeaderTabs" :key="tab.url">
        <nuxt-link
          :to="localePath('/manage' + tab.url)"
          :class="{ active: activeRoute.startsWith(tab.url) }"
        >
          <span>{{ $T(tab.name) }}</span>
        </nuxt-link>
      </li>
    </ul>
    <div
      :title="(!useCorrectSha().value || $sameSha.value) ? (allPassed ? $t('all-verified'):$t('token-and-passwd')) : $t('commit-id-not-correct')"
      :class="{warning: useCorrectSha().value && !$sameSha.value}"
      @click="emit('show-verify')"
    >
      <svg-icon
        :class="{invalid: !githubToken, active: allPassed }"
        name="password"
      />
    </div>
    <nuxt-link title="🚀" :to="localePath(travel)">
      <svg-icon name="rocket" />
    </nuxt-link>
    <nuxt-link v-if="isDev" title="svgs" :to="localePath('/manage/all-svg')" target="_blank">
      SVG
    </nuxt-link>
  </div>
</template>
