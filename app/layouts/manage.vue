<script setup lang="tsx">
import { BookOpen, CheckCheck, FileEdit, Image, ImagePlus, Key, Menu, MoonStar, Rocket, Settings, Sun, Upload, X } from "lucide-vue-next";
import type { FunctionalComponent } from "vue";
import { isAuthor as checkIsAuthor } from "ls:~/utils/nuxt/manage/github";
import Stage from "~/pages/manage/comps/stage.vue";
import UploadFile from "~/pages/manage/comps/upload-file.vue";
import { GithubTokenKey } from "~/utils/common/constants";
import { HeaderTabs, type HeaderTabUrl } from "~/utils/common/types";
import { translate } from "~/utils/nuxt/i18n";
import { rmLocalStorage, setLocalStorage } from "~/utils/nuxt/localStorage";
import { notify } from "~/utils/nuxt/notify";
import { calcRocketUrl, watchUntil } from "~/utils/nuxt/utils";
import { isDev } from "~/utils/nuxt/constants";
import { useStaging } from "~/utils/hooks/useStaging";

const inputTokenDisabled = isDev || __NB_BUILDTIME_VITESTING__;

const showPwdModal = useShowPwdModal();
const loadingState = useLoadingState();

const githubToken = useGithubToken();
const encryptor = useEncryptor();
const isAuthor = useIsAuthor();
const { themeMode, toggleThemeMode } = useThemeMode();
const sameSha = computed(() => useRemoteLatestSha().value === __NB_CURRENT_GIT_SHA__);

const IconMap = {
  "/articles": FileEdit,
  "/records": Image,
  "/knowledges": BookOpen
} as Record<HeaderTabUrl, FunctionalComponent>;

const mobileMenuShow = ref(false);
const showUploadFile = ref(false);
const showStagedModal = ref(false);
const inputToken = ref(githubToken.value);
const inputPwd = ref(encryptor.usePasswd.value);
const checkingToken = ref(false);

const { stagedItems, initializeStagedItems } = useStaging();
const hasStagedItems = computed(() => stagedItems.value.length > 0);

const activeRoute = computed(() => {
  return useRoute().path.replace(/^\/manage\//, "/");
});
const rocketUrl = computed(() => {
  return calcRocketUrl();
});
const allPassed = computed(() => !!githubToken && encryptor.passwdCorrect.value);

// 进入manage界面后，大概率会用到encrypt，所以这里先异步加载，尚未遇到bug
encryptor.init();

// 随时和githubToken保持一致，因为只有正确的值才会被赋给githubToken
watch(githubToken, (token) => {
  inputToken.value = token;
});

const modalOk = async () => {
  // 密码不用判断，直接修改
  encryptor.usePasswd.value = inputPwd.value;
  // 未改变token
  if (inputToken.value === githubToken.value) {
    showPwdModal.value = false;
    return;
  }
  // 输入为空，则删除本地token
  if (!inputToken.value && !!githubToken.value) {
    notify({
      title: translate("token-deleted"),
      description: translate("token-deleted-from-local")
    });
    rmLocalStorage(GithubTokenKey);
    githubToken.value = inputToken.value;
    showPwdModal.value = false;
    return;
  }
  checkingToken.value = true;
  try {
    const res = await checkIsAuthor(inputToken.value);
    notify({
      title: res ? translate("token-verified") : translate("token-unverified"),
      type: res ? "success" : "error",
      description: res ? translate("token-saved") : undefined
    });
    if (res) {
      setLocalStorage(GithubTokenKey, inputToken.value);
      showPwdModal.value = false;
      isAuthor.value = true;
    }
  } catch (e) {
    notify({
      title: translate("error"),
      type: "error",
      description: String(e)
    });
  } finally {
    checkingToken.value = false;
  }
};

onMounted(() => {
  watchUntil(isAuthor, (isAuthor) => {
    if (!isAuthor) {
      showPwdModal.value = true;
    }
  }, { immediate: true }, isAuthor => isAuthor !== null, "cancelAfterUntil");
  initializeStagedItems();
});
</script>

<template>
  <span
    v-show="!!loadingState"
    class="fixed left-0 top-0 z-headerLoading h-0.5 bg-primary-500"
    :style="{ width: `${loadingState}%` }"
  />

  <div class="flex items-stretch">
    <aside
      :class="twMerge(
        'h-screen md:sticky inset-y-0 left-0 z-20 shadow-lg transition duration-300 ease-in-out',
        'max-md:fixed max-md:w-screen',
        mobileMenuShow ? 'max-md:bg-dark-500/30' : 'max-md:pointer-events-none'
      )"
      @click.self="mobileMenuShow = false"
    >
      <nav
        :class="twMerge(
          'h-full w-fit bg-white px-4 dark:bg-dark-800 max-md:mr-auto transition duration-300 ease-in-out',
          !mobileMenuShow && 'max-md:-translate-x-full'
        )"
      >
        <div class="flex items-center justify-between py-1 text-dark-500 dark:text-dark-300 md:justify-center">
          <button
            :class="twMerge(
              'icon-button'
            )"
            @click="toggleThemeMode"
          >
            <MoonStar v-if="themeMode === 'light'" />
            <Sun v-else />
          </button>
          <button
            :class="twMerge(
              'md:hidden px-2 py-1 rounded-lg pointer-events-auto',
              !mobileMenuShow ? 'max-md:translate-x-12 bg-white dark:bg-dark-800 shadow-md' : 'bg-dark-50 dark:bg-dark-700'
            )"
            @click="mobileMenuShow = !mobileMenuShow"
          >
            <component
              :is="mobileMenuShow ? X : Menu"
              class="size-5"
            />
          </button>
        </div>
        <div class="my-1 space-y-1 border-y border-dark-200 py-3 dark:border-dark-700">
          <NuxtLink
            v-for="item in HeaderTabs"
            :key="item"
            :to="`/manage${item}`"
            :class="twMerge($style.menuItem, activeRoute.startsWith(item) && $style.menuItemActive)"
          >
            <component :is="IconMap[item]" />
            {{ $t(item) }}
          </NuxtLink>
          <NuxtLink
            to="/manage/config"
            :class="twMerge($style.menuItem, activeRoute.startsWith('/config') && $style.menuItemActive)"
          >
            <Settings />
            {{ $t('config') }}
          </NuxtLink>
        </div>

        <div class="pt-2">
          <div class="flex justify-between gap-4 px-2 py-4">
            <NuxtLink
              :to="rocketUrl"
              :class="twMerge('anim-shake', $style.menuAction)"
              title="🚀"
            >
              <Rocket />
            </NuxtLink>

            <button
              :class="$style.menuAction"
              :title="$t('files')"
              @click="showUploadFile = true"
            >
              <ImagePlus />
            </button>

            <button
              v-if="hasStagedItems"
              :class="twMerge($style.menuAction, '!text-green-400')"
              :title="$t('staged-items-count', [stagedItems.length])"
              data-testid="commit-staged-btn"
              @click="showStagedModal = true"
            >
              <Upload />
            </button>

            <button
              :class="twMerge(
                $style.menuAction,
                !sameSha && '!text-orange-400',
                !githubToken && '!text-red-400',
                allPassed && '!text-green-400'
              )"
              :title="sameSha ? (allPassed ? $t('all-verified') : $t('token-and-passwd')) : $t('commit-id-not-correct')"
              data-testid="show-token-password-btn"
              @click="showPwdModal = true"
            >
              <Key />
            </button>
          </div>
        </div>
      </nav>
    </aside>

    <div class="min-h-screen flex-1 overflow-hidden">
      <div class="mx-auto size-full max-w-[1440px] rounded-lg p-4 *:rounded-lg *:bg-white *:shadow-md *:dark:bg-dark-800 max-md:p-1">
        <client-only>
          <slot />
        </client-only>
      </div>
    </div>
  </div>

  <common-modal
    v-model="showPwdModal"
    :loading="checkingToken"
    ok-test-id="token-password-confirm"
    @confirm="modalOk"
    @cancel="inputToken = githubToken"
  >
    <template #title>
      Token & Password
    </template>
    <template #body>
      <label class="flex flex-col">
        <span class="mb-1 flex gap-1.5">Github Token
          <CheckCheck
            v-if="!!githubToken"
            class="size-5 text-primary-600"
          />
        </span>
        <input
          v-model="inputToken"
          :placeholder="$t('please-input')"
          data-focus
          :disabled="inputTokenDisabled"
        >
      </label>
      <label class="mt-4 flex flex-col">
        <span class="mb-1 flex gap-1.5">
          {{ $t('passwd') }}
          <CheckCheck
            v-if="encryptor.passwdCorrect.value"
            class="size-5 text-primary-600"
          />
        </span>
        <input
          v-model="inputPwd"
          data-testid="password-input"
          :placeholder="$t('please-input')"
        >
      </label>
    </template>
  </common-modal>

  <upload-file v-model="showUploadFile" />

  <stage v-model="showStagedModal" />
</template>

<style module>
.menuItem {
  @apply flex items-center rounded-md px-3 py-2.5 text-base font-semibold text-dark-700 dark:text-dark-300;

  svg {
    @apply mr-3 size-5;
  }
}

.menuItem:hover, .menuItemActive{
  @apply bg-primary-50 text-primary-700 dark:bg-dark-700 dark:text-primary-400;
}

.menuAction {
  @apply rounded-full flex items-center justify-center size-10 text-dark-500 dark:text-dark-300 bg-dark-50 dark:bg-dark-700 hover:bg-dark-100 hover:dark:bg-dark-900 hover:text-primary-600 dark:hover:text-primary-500;

  svg {
    @apply size-5;
  }
}
</style>
