<script setup lang="ts">
import { HeaderTabs } from "~/utils/types";
import { calcRocketUrl } from "~/utils/utils";
import { isDev } from "~/utils/constants";

const emit = defineEmits(["upload-image", "show-verify"]);

const githubToken = useGithubToken();
const encryptor = useEncryptor();
const allPassed = computed(() => !!githubToken && encryptor.passwdCorrect.value);

const activeRoute = computed(() => {
  return useRoute().path.replace(/^\/manage\//, "/");
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
          to="/manage/config"
          :class="{ active: activeRoute.startsWith('/config') }"
        >
          {{ $T('config') }}
        </nuxt-link>
      </li>
      <li v-for="tab in HeaderTabs" :key="tab.url">
        <nuxt-link
          :to="'/manage' + tab.url"
          :class="{ active: activeRoute.startsWith(tab.url) }"
        >
          <span>{{ $T(tab.name) }}</span>
        </nuxt-link>
      </li>
    </ul>
    <div :title="$sameSha.value ? (allPassed ? $t('all-verified'):$t('token-and-passwd')) : $t('commit-id-not-correct')" :class="{warning: !$sameSha.value}" @click="emit('show-verify')">
      <svg-icon
        :class="{invalid: !githubToken, active: allPassed }"
        name="password"
      />
    </div>
    <nuxt-link title="🚀" :to="travel">
      <svg-icon name="rocket" />
    </nuxt-link>
    <nuxt-link v-if="isDev" title="svgs" to="/manage/all-svg" target="_blank">
      SVG
    </nuxt-link>
  </div>
</template>
