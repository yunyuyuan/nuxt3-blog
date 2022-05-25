<script setup lang="ts">
import { themeBackground } from "~/utils/constants";
import config from "~/config";

const sha = useRuntimeConfig().app.NUXT_ENV_CURRENT_GIT_SHA.substring(0, 8);
const commitUrl = `https://github.com/${config.githubName}/${config.githubRepo}/commit/${sha}`;
const buildTime = ref<string>("Unknown");

const paragraphs = [
  "幽深宇宙已岁逾百亿，惟闪烁星光点缀生机",
  "我常仰望浩瀚天际，思念在同一颗星球的你",
  "想，那转瞬的迷人流星，也许就是你的回眸",
  "光坠之地，吾之忧祈",
  "——2021.12.4"
];

onBeforeMount(async () => {
  buildTime.value = await (await fetch("/timestamp.txt")).text();
});
</script>

<template>
  <div class="about flexc">
    <img :src="themeBackground" alt="bg">
    <div class="flexc paragraphs">
      <p v-for="p,idx in paragraphs" :key="idx">
        {{ p }}
      </p>
    </div>
    <div class="status">
      Last build &lt;<a target="_blank" :href="commitUrl">{{ sha }}</a>&gt; successed at
      <time>{{ buildTime }}</time>
    </div>
  </div>
</template>

<style lang="scss">
@import "assets/style/var";

#default-layout.in-about {
  #header {
    background: rgba($background, 0.1);
    backdrop-filter: blur(1px);
  }

  #body {
    padding-top: 0;

    .about {
      width: 100vw;
      height: calc(100vh - #{$footer-height});
      padding-bottom: $footer-height;
      position: relative;
      font-family: $font-source-han-sans;

      img {
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        object-fit: cover;
        object-position: right;
        z-index: 1;
      }

      .paragraphs {
        position: relative;
        z-index: 2;
        padding-top: 100px + $header-height;
        justify-content: center;

        p {
          font-size: 16px;
          letter-spacing: 0.8px;
          color: white;
          font-weight: 300;

          &:not(:last-of-type) {
            margin-bottom: 20px;
          }
        }
      }

      .status {
        color: #eee;
        opacity: 0.5;
        font-size: 13px;
        position: absolute;
        bottom: 10px;
        right: 10px;
        z-index: 1;
        transition: $common-transition;

        &:hover {
          opacity: 1;
        }

        time {
          color: #ffb350;
        }
      }
    }
  }

  #footer {
    position: fixed;
    width: 100%;
    left: 0;
    bottom: 20px;
    z-index: 2;

    .middle {
      color: #a1a1a1;
    }

    &:hover {
      .middle {
        color: #e7e7e7;
      }
    }
  }

  #footer,
  #body .about {
    a[href] {
      color: #49b6a3;
      transition: $common-transition;

      &:hover {
        color: #50e5d4;
      }
    }
  }
}
</style>
