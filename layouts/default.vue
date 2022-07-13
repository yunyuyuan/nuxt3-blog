<script setup lang="ts">
import { githubRepoUrl, inBrowser } from "~/utils/constants";
import { HeaderTabs } from "~/utils/types";
import { calcRocketUrl } from "~/utils/utils";
import config from "~/config";

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
  const Headroom = (await import("headroom.js")).default as any;
  headroom = new Headroom(headerRef.value, {
    offset: 48
  });
  headroom.init();
});
onBeforeUnmount(() => {
  headroom?.destroy();
});
</script>

<template>
  <div id="default-layout" :class="{'in-about': inAbout}">
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
      <a
        v-if="openEdit === githubRepoUrl"
        class="home flex"
        target="_blank"
        :href="githubRepoUrl"
        title="Go to Github"
      >
        <svg-icon name="github" />
      </a>
      <nuxt-link v-else class="home flex" :to="openEdit" title="🚀">
        <svg-icon name="rocket" />
      </nuxt-link>
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
  </div>
</template>

<style lang="scss">
@import "assets/style/var";

#body {
  min-height: calc(100vh - #{$header-height + $footer-height});
  padding-top: $header-height;
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
  #header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    height: $header-height;
    background: #303947;
    z-index: $z-index-header;
    transition: $common-transition;

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
      font-family: "Source Code Pro", serif;

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

    .home,
    .about {
      @include square(28px);

      transition: $common-transition;
    }

    .home:hover {
      svg {
        fill: white;
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

    &.headroom--not-top {
      box-shadow: 0 0 8px #4c4c4c;
      height: $header-height - 6px;

      .item {
        font-size: 18px;
      }

      .home,
      .about {
        @include square(23px);
      }
    }
  }
}

#footer {
  height: $footer-height;

  .middle {
    font-size: 13px;
    color: #7c7c7c;
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
