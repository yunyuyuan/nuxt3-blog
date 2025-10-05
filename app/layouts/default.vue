<script setup lang="tsx">
import { Languages, Sun, MoonStar, Rocket, Menu, Rss, Key, Search } from "lucide-vue-next";
import config from "~~/config";
import { i18nLocales, type I18nCode } from "~/utils/common/locales";
import { HeaderTabs } from "~/utils/common/types";
import { calcRocketUrl } from "~/utils/nuxt/utils";
import { OfficialRepo } from "~/utils/common/constants";

const algoliaEnabled = __NB_ALGOLIA_ENABLED__;

const { i18nCode, changeI18n } = useI18nCode();
const { themeMode, toggleThemeMode } = useThemeMode();
const loadingState = useLoadingState();

const route = useRoute();
const mobileMenuShow = ref(false);
watch(() => route.path, () => {
  mobileMenuShow.value = false;
});

const themeAnimate = ref(false);
const footerDomain = ref("");

const showI18n = ref(false);
const setLocale = (locale: I18nCode) => {
  changeI18n(locale);
  showI18n.value = false;
};

const toggleTheme = () => {
  themeAnimate.value = true;
  nextTick(() => {
    toggleThemeMode();
  });
};

const rocketUrl = computed(() => {
  return calcRocketUrl();
});

onMounted(async () => {
  footerDomain.value = window.location.hostname;
});

const encryptor = useEncryptor();
const showPwdModal = ref(false);
const inputPwd = ref(encryptor.usePasswd.value);
</script>

<template>
  <div class="m-auto flex min-h-screen flex-col">
    <div
      :class="twMerge(
        'fixed z-modeBg size-0 rounded-full right-12 top-6',
        themeMode === 'dark' ? $style.themeAnimateBgDark : $style.themeAnimateBgLight,
        themeAnimate && $style.themeAnimateBg
      )"
    />
    <nav :class="$style.nav">
      <div class="container mx-auto flex h-header items-center px-4 max-md:justify-between max-md:px-2 md:grid md:grid-cols-[1fr_auto_1fr] md:items-center lg:px-8">
        <NuxtLink
          class="group shrink-0 md:justify-self-start"
          to="/about"
        >
          <span class="text-xl font-medium text-primary-700 drop-shadow hover:text-primary-500 dark:text-primary-300 dark:hover:text-primary-500">{{ config.nickName }}</span>
        </NuxtLink>
        <div
          :class="$style.pcMenu"
          class="md:justify-self-center"
        >
          <NuxtLink
            v-for="item in HeaderTabs"
            :key="item"
            :to="item"
          >
            {{ $t(item) }}
          </NuxtLink>
        </div>
        <div class="flex items-center gap-4 max-md:gap-2 md:justify-end md:justify-self-end">
          <NuxtLink
            v-if="algoliaEnabled"
            class="icon-button max-md:hidden"
            :title="$t('search-all')"
            to="/search"
          >
            <Search />
          </NuxtLink>
          <button
            class="icon-button relative !overflow-visible"
            @click="showI18n = true"
          >
            <Languages />
            <common-dropdown
              v-model:show="showI18n"
              wrap-class="mt-2"
            >
              <div>
                <client-only>
                  <div
                    v-for="locale of i18nLocales"
                    :key="locale.code"
                    :class="twMerge(
                      $style.i18nSelect,
                      i18nCode === locale.code && $style.i18nSelectActive
                    )"
                    @click="setLocale(locale.code)"
                  >
                    {{ locale.name }}
                  </div>
                </client-only>
              </div>
            </common-dropdown>
          </button>
          <button
            :class="twMerge(
              'icon-button',
              $style.themeMode,
              themeMode === 'dark' && $style.modeDark
            )"
            :title="$t('switch-mode', [$t(`mode-${themeMode === 'light' ? 'dark' : 'light'}`)])"
            @click="toggleTheme"
          >
            <span :class="themeAnimate && $style.themeAnimateToggle">
              <MoonStar class="size-5" />
              <Sun class="size-5" />
            </span>
          </button>
          <div :class="$style.goManage">
            <NuxtLink
              :to="rocketUrl"
              title="🚀"
              class="icon-button anim-shake"
            >
              <Rocket />
            </NuxtLink>
            <div
              :class="twMerge($style.pwd, encryptor.passwdCorrect.value && $style.pwdValid)"
              :title="$t('passwd')"
              @click="showPwdModal = true"
            >
              <span>
                <Key />
              </span>
            </div>
          </div>
          <span
            class="icon-button !hidden max-md:!flex"
            @click="mobileMenuShow = !mobileMenuShow"
          >
            <Menu />
          </span>
        </div>
      </div>

      <div
        v-show="mobileMenuShow"
        :class="$style.mobileMenu"
      >
        <NuxtLink
          v-for="item in HeaderTabs"
          :key="item"
          :to="item"
        >
          {{ $t(item) }}
        </NuxtLink>
        <NuxtLink
          v-if="algoliaEnabled"
          class="icon-button !w-full"
          :title="$t('search-all')"
          to="/search"
        >
          <Search />
        </NuxtLink>
      </div>
    </nav>
    <span
      v-show="!!loadingState"
      class="fixed left-0 top-0 z-headerLoading h-0.5 bg-primary-500"
      :style="{ width: `${loadingState}%` }"
    />
    <section class="z-body grow">
      <slot />
    </section>
    <footer :class="$style.footer">
      <div class="mx-auto flex flex-col items-center gap-1">
        <span>Copyright (c) 2019-2025 <b><a
          target="_blank"
          :href="'https://github.com/'+config.githubName"
        >{{ config.nickName }}</a> | {{ footerDomain }}</b></span>
        <span class="flex"><a
          target="_blank"
          href="/sitemap.xml"
          title="rss"
        >RSS <Rss class="size-4" /></a>| Powered By <a
          :href="`https://github.com/${OfficialRepo}`"
          target="_blank"
        >nuxt3-blog</a></span>
      </div>
    </footer>

    <common-modal
      v-model="showPwdModal"
      @confirm="encryptor.usePasswd.value = inputPwd;showPwdModal = false"
    >
      <template #title>
        {{ $t('passwd') }}
      </template>
      <template #body>
        <input
          v-model="inputPwd"
          data-focus
          :placeholder="$t('input-passwd')"
          class="w-full"
        >
      </template>
    </common-modal>
  </div>
</template>

<style module>
@keyframes light-dark {
  0% {
    @apply size-0 bg-nb-light;
  }

  100% {
    @apply bg-nb-dark;

    width: calc(200vw * 1.5);
    height: calc(200vh * 1.5);
  }
}

@keyframes dark-light {
  0% {
    @apply size-0 bg-nb-dark;
  }

  100% {
    @apply bg-nb-light;

    width: calc(200vw * 1.5);
    height: calc(200vh * 1.5);
  }
}

.themeAnimateBg {
  animation-duration: 1s;
  animation-timing-function: cubic-bezier(0, 0, 0, 1);
  animation-fill-mode: forwards;
  transform: translate(50%, -50%);
}

.themeAnimateBgLight {
  animation-name: dark-light;
}

.themeAnimateBgDark {
  animation-name: light-dark;
}

.nav {
  @apply w-full z-header max-md:!transform-none;
  @apply transition-all duration-300;
}

.mobileMenu {
  @apply flex flex-col mt-2 mb-4 px-4 md:hidden;

  a {
    @apply flex items-center font-semibold pl-2 py-2 rounded text-base text-dark-600 dark:text-dark-200 hover:bg-dark-200 dark:hover:bg-dark-700 hover:text-primary-700;
  }
}

.pcMenu {
  @apply flex max-md:hidden gap-10 justify-center;

  a {
    @apply -mb-[4px] font-semibold flex flex-col items-center gap-[3px] text-lg text-dark-600 dark:text-dark-200 hover:text-primary-700 dark:hover:text-primary-400 after:block after:h-[2px] after:w-[120%] after:bg-transparent after:transition hover:after:bg-primary-700;
  }
}

.i18nSelect{
  @apply rounded-lg cursor-pointer px-4 py-2 text-sm text-dark-600 dark:text-dark-300 hover:bg-primary-100 dark:hover:bg-primary-900 transition;
}
.i18nSelectActive {
  @apply text-primary-700 dark:text-primary-500;
}

.themeMode {
  @apply overflow-hidden block;

  > span {
    @apply flex flex-col items-center justify-around w-full h-[200%];
  }
}

.themeAnimateToggle {
  transition: all 0.2s cubic-bezier(0, -0.01, 0.23, 1.56);
}

.modeDark {
  span {
    transform: translateY(-50%);
  }
}

.goManage {
  @apply relative flex items-center justify-center;

  > a {
    @apply relative flex justify-center overflow-visible;
  }

  &:hover .pwd {
    transform: translateY(100%) scaleY(100%);
  }
}

.pwd {
  @apply absolute bottom-0 origin-top transition;
  @apply before:content-[''] before:block before:w-full before:h-3;

  transform: translateY(100%) scaleY(0);

  span {
    @apply overflow-hidden flex items-center border border-dark-200 dark:border-dark-800 bg-white dark:bg-dark-800 cursor-pointer shadow-md px-4 py-2 rounded-lg;
  }

  svg {
    @apply text-dark-700 dark:text-dark-300 size-4;
  }
}

.pwdValid {
  svg {
    @apply text-primary-700 dark:text-primary-500;
  }
}

.footer {
  @apply pb-4 relative z-footer text-sm leading-6 text-dark-600 dark:text-dark-400;

  a {
    @apply mx-2 text-primary-700 hover:text-primary-500 dark:text-primary-500 hover:dark:text-primary-600 inline-flex items-center gap-1;
  }
}
</style>
