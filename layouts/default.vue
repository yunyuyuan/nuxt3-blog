<script setup lang="tsx">
import { Languages, Sun, MoonStar, Rocket, Menu, Rss, Key, Search } from "lucide-vue-next";
import Headroom from "headroom.js";
import tailwindConfig from "#tailwind-config";
import NuxtLink from "~/node_modules/nuxt/dist/app/components/nuxt-link";
import config from "~/config";
import { i18nLocales, type I18nCode } from "~/utils/common/locales";
import { HeaderTabs } from "~/utils/common/types";
import { calcRocketUrl } from "~/utils/nuxt/utils";

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

let headroom: undefined | Headroom;
const headerRef = ref();
onMounted(async () => {
  footerDomain.value = window.location.hostname;

  headroom = new Headroom(headerRef.value, {
    offset: parseInt(tailwindConfig.theme.spacing.header.replace("px", ""))
  });
  headroom.init();
});
onBeforeUnmount(() => {
  headroom?.destroy();
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
    <nav
      ref="headerRef"
      :class="$style.nav"
    >
      <div class="container mx-auto flex h-header items-center justify-between px-4 max-md:px-2 lg:px-8">
        <NuxtLink
          class="group shrink-0"
          to="/about"
        >
          <span class="hidden pr-1 text-sm group-hover:inline">{{ $t('about') }}</span>
          <span class="text-xl font-medium text-primary-700 drop-shadow hover:text-primary-500 dark:text-primary-300 dark:hover:text-primary-500">{{ config.nickName }}</span>
        </NuxtLink>
        <div :class="$style.pcMenu">
          <NuxtLink
            v-for="item in HeaderTabs"
            :key="item"
            :to="item"
          >
            {{ $t(item) }}
          </NuxtLink>
        </div>
        <div class="flex items-center gap-4">
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
              <MoonStar />
              <Sun />
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
    <section class="z-body min-h-[calc(100vh_-_64px)] pt-header">
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
          href="https://github.com/yunyuyuan/nuxt3-blog"
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
  animation-duration: 0.5s;
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
  @apply fixed w-full z-header max-md:!transform-none;
  @apply shadow max-md:!shadow transition bg-white dark:bg-dark-800;

  &:global(:not(.headroom--pinned).headroom--not-top) {
    @apply shadow-none -translate-y-full;
  }
}

.mobileMenu {
  @apply flex flex-col mt-2 mb-4 px-4 md:hidden;

  a {
    @apply flex items-center font-medium pl-2 py-2 rounded text-base text-dark-800 dark:text-dark-200 hover:bg-dark-200 dark:hover:bg-dark-700 hover:text-primary-700;
  }
}

.pcMenu {
  @apply flex max-md:hidden gap-10;

  a {
    @apply -mb-[4px] font-medium flex flex-col items-center gap-[3px] text-lg text-dark-800 dark:text-dark-200 hover:text-primary-700 dark:hover:text-primary-400 after:block after:h-[1.5px] after:w-[120%] after:bg-transparent after:transition hover:after:bg-primary-700;
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
  @apply pb-4 relative z-footer text-sm text-dark-600 dark:text-dark-400;

  a {
    @apply mx-1 text-primary-700 hover:text-primary-500 dark:text-primary-500 hover:dark:text-primary-600 inline-flex items-center gap-1;
  }
}
</style>
