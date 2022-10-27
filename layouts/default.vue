<script setup lang="ts">
import { githubRepoUrl, inBrowser } from "~/utils/constants";
import { HeaderTabs } from "~/utils/types";
import { calcRocketUrl } from "~/utils/utils";
import config from "~/config";

const { themeMode, toggleThemeMode, isFirst } = useThemeMode();
const pageLoading = useLoading();
const route = useRoute();
const footerDomain = inBrowser ? window.location.hostname : "";

const activeRoute = computed(() => {
  const path = route.path.split("/")[1];
  return path;
});

const inAbout = computed(() => {
  return route.path.startsWith("/about");
});

const openEdit = computed(() => {
  return calcRocketUrl();
});

let headroom;
const headerRef = ref();
onMounted(async () => {
  const Headroom = (await import("headroom.js")).default;
  headroom = new Headroom(headerRef.value, {
    offset: 48
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
  <div id="default-layout" :class="{'in-about': inAbout}">
    <div class="mode-bg" :class="[themeMode, {active: !isFirst}]" />
    <nav id="header" ref="headerRef" class="flex w100">
      <nuxt-link
        v-for="item in HeaderTabs"
        :key="item.url"
        class="item"
        :class="{ active: activeRoute === item.url.substring(1) }"
        :to="item.url"
      >
        {{ item.name }}
        <span />
        <span />
        <span />
        <span />
      </nuxt-link>
      <del />
      <a class="mode" :class="themeMode" :title="`切换到${themeMode === 'light' ? '夜间' : '日间'}模式`" @click="toggleThemeMode">
        <span>
          <svg-icon name="mode-light" />
          <svg-icon name="mode-dark" />
        </span>
      </a>
      <sub />
      <a
        v-if="openEdit === githubRepoUrl"
        class="home flex"
        target="_blank"
        :href="githubRepoUrl"
        title="Go to Github"
      >
        <svg-icon name="github" />
      </a>
      <div v-else class="home go-manage flex">
        <nuxt-link :to="openEdit" title="🚀">
          <svg-icon name="rocket" />
        </nuxt-link>
        <div class="pwd flex" :class="{valid: encryptor.passwdCorrect.value}" title="密码" @click="showPwdModal = true">
          <svg-icon name="password" />
        </div>
      </div>
      <sub />
      <nuxt-link class="about" to="/about" title="关于">
        <img class="s100" src="/favicon.jpg" alt="头像">
      </nuxt-link>
      <span v-show="!!pageLoading.loadingState.value" class="loading" :style="{width: `${pageLoading.loadingState.value}%`}" />
    </nav>
    <section id="body">
      <slot />
    </section>
    <footer id="footer" class="flex w100">
      <div class="middle flexc">
        <span>Copyright (c) 2019-2022 <b><a target="_blank" :href="'https://github.com/'+config.githubName">{{ config.nickName }}</a> | {{ footerDomain }}</b></span>
        <span class="flex"><a class="rss" target="_blank" href="/sitemap.xml" title="rss">RSS <svg-icon name="rss" /></a>| Powered By <a class="nuxt" href="https://v3.nuxtjs.org/" target="_blank">Nuxtjs</a></span>
      </div>
    </footer>
    <common-modal v-model="showPwdModal" @confirm="encryptor.usePasswd.value = inputPwd;showPwdModal = false">
      <template #title>
        密码
      </template>
      <template #body>
        <input v-model="inputPwd" placeholder="请输入密码" style="font-size: 16px;padding: 5px;width: calc(100% - 12px);">
      </template>
    </common-modal>
  </div>
</template>

<style lang="scss">
@use "sass:math";
@import "assets/style/var";

#body {
  min-height: calc(100vh - #{$header-height + $footer-height});
  padding-top: $header-height;
  z-index: $z-index-body;
  position: relative;
}

#__nuxt {
  margin: auto;
}

@include mobile {
  #__nuxt {
    width: 100%;
  }
}

#default-layout {
  $circle-w: calc(200vw * 1.5);
  $circle-h: calc(200vh * 1.5);

  @keyframes light-dark {
    0% {
      background: $background;
      width: 0;
      height: 0;
    }

    100% {
      background: $background-dark;
      width: $circle-w;
      height: $circle-h;
    }
  }

  @keyframes dark-light {
    0% {
      background: $background-dark;
      width: 0;
      height: 0;
    }

    100% {
      background: $background;
      width: $circle-w;
      height: $circle-h;
    }
  }

  >.mode-bg {
    position: fixed;
    z-index: $z-index-mode-bg;
    width: 0;
    height: 0;
    top: math.div($header-height, 2);
    right: 50px;
    border-radius: 50%;

    &.active {
      animation-duration: $animation-duration * 2;
      animation-timing-function: $animation-function;
      animation-fill-mode: forwards;
      transform: translate(50%, -50%);

      &.light {
        animation-name: dark-light;
      }

      &.dark {
        animation-name: light-dark;
      }
    }
  }

  #header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: $header-height;
    background: #303947;
    box-shadow: 0 0 8px #4c4c4c8e;
    z-index: $z-index-header;
    transition: $common-transition;

    @include dark-mode {
      box-shadow: 0 0 8px rgb(15 15 15 / 56%);
    }

    .item {
      color: white;
      text-decoration: none;
      margin-left: 16px;
      transition: $common-transition;
      position: relative;

      $padding: 2px;

      font-weight: bold;
      padding: 2px 5px;
      word-break: keep-all;
      cursor: pointer;
      font-size: 20px;

      span {
        position: absolute;
        background: white;

        $offset: 4px;

        transition: $common-transition;

        &:nth-child(1) {
          height: 1px;
          width: 0;
          top: -$padding;
          left: -$padding;
          transform: translateX(-$offset);
        }

        &:nth-child(2) {
          width: 1px;
          height: 0;
          top: -$padding;
          left: -$padding;
          transform: translateY(-$offset);
        }

        &:nth-child(3) {
          height: 1px;
          width: 0;
          bottom: -$padding;
          right: -$padding;
          transform: translateX($offset);
        }

        &:nth-child(4) {
          width: 1px;
          height: 0;
          bottom: -$padding;
          right: -$padding;
          transform: translateY($offset);
        }
      }

      &:not(.active):hover {
        text-shadow: 0 0 10px #fff;

        span {
          $size: calc(100% + #{$padding * 3});

          &:nth-child(1) {
            width: $size;
          }

          &:nth-child(2) {
            height: $size;
          }

          &:nth-child(3) {
            width: $size;
          }

          &:nth-child(4) {
            height: $size;
          }
        }
      }

      &.active {
        background: #f6fbff;
        color: #303947;
      }
    }

    del {
      margin: auto;
    }

    .mode,
    .home,
    .about {
      @include square(28px);

      transition: $common-transition;
    }

    .mode,
    .home {
      height: $header-height;

      &:hover {
        svg {
          fill: white;
        }
      }
    }

    .mode {
      cursor: pointer;
      overflow: hidden;

      > span {
        display: flex;
        flex-direction: column;
        height: 100%;
        transition: all $animation-duration cubic-bezier(0, -0.01, 0.23, 1.56);

        svg {
          flex-shrink: 0;
        }
      }

      &.dark {
        > span {
          transform: translateY(-100%);
        }
      }
    }

    .go-manage {
      position: relative;
      display: flex;
      justify-content: center;

      >a {
        height: 100%;
      }

      div.pwd {
        cursor: pointer;
        overflow: hidden;
        justify-content: center;
        background: white;
        box-shadow: 0 0 10px rgb(0 0 0 / 20%);
        border-radius: 8px;
        padding: 8px 20px;
        position: absolute;
        bottom: 0;
        transition: $common-transition;
        transform-origin: top;
        transform: translateY(100%) scaleY(0);

        @include dark-mode {
          background: #636363;

          svg {
            fill: white;
          }
        }

        svg {
          fill: rgb(0 0 0);

          @include square(20px);
        }

        &.valid {
          svg {
            fill: $theme-color-darken;
          }
        }
      }

      &:hover {
        div.pwd {
          transform: translateY(100%) scaleY(100%);
        }
      }
    }

    svg {
      fill: #d3d3d3;

      @include square;
    }

    sub {
      width: 1px;
      height: 50%;
      background: white;
      margin: 0 12px;
    }

    .about {
      margin-right: 10px;
      position: relative;
      opacity: 0.85;

      img {
        position: relative;
        border-radius: 2px;
      }

      &:hover {
        opacity: 1;
      }
    }

    >.loading {
      position: absolute;
      left: 0;
      bottom: 0;
      height: 3px;
      z-index: 2;
      background: $theme-color;
      transition: width 0.1s linear;
    }

    &:not(.headroom--pinned).headroom--not-top {
      transform: translateY(-100%);
      box-shadow: none;
    }
  }
}

#footer {
  height: $footer-height;
  position: relative;
  z-index: $z-index-footer;

  .middle {
    font-size: 13px;
    color: #7c7c7c;

    @include dark-mode {
      color: rgb(194 194 194);
    }

    margin: auto;
    transition: $common-transition;

    b {
      transition: $common-transition;
    }

    span:last-of-type {
      margin: 6px 0;
    }
  }

  &:hover {
    .middle {
      color: black;
    }
  }

  a {
    color: #1c1c1c;

    @include dark-mode {
      color: white;

      &:hover {
        color: $theme-color-lighten;
      }
    }

    transition: $common-transition;

    &:hover {
      color: $theme-color;
    }
  }

  .nuxt {
    margin-left: 5px;
  }

  .rss {
    display: inline-flex;
    align-items: center;
    margin-right: 5px;
    transition: $common-transition;
    fill: $theme-color;

    svg {
      width: 16px;
      height: 16px;
      margin-left: 5px;
    }

    &:hover {
      transform: scale(1.1);
    }
  }
}
</style>
