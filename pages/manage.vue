<script setup lang="ts">
import { RouteLocationNormalized } from "vue-router";
import { HeaderTabs } from "~/utils/types";
import { isAuthor } from "~/utils/manage/github";
import { notify } from "~/utils/notify/notify";
import { calcRocketUrl, rmLocalStorage, setLocalStorage } from "~/utils/utils";
import { GithubTokenKey } from "~/utils/constants";

const isDev = useRuntimeConfig().public.dev;

const pageLoading = useLoading();
definePageMeta({
  layout: "blank",
  middleware (to: RouteLocationNormalized) {
    if (to.name === "manage") {
      return navigateTo("/manage/config");
    }
  }
});

const correctCommitId = useCorrectCommitId();

const activeRoute = computed(() => {
  return useRoute().path.replace(/^\/manage\//, "/");
});
const travle = computed(() => {
  return calcRocketUrl();
});

// mobile menu
const menuShow = ref<boolean>(true);
const toggleMenu = () => {
  menuShow.value = !menuShow.value;
};

// token & password
const githubToken = useGithubToken();
const encryptor = useEncryptor();
const allPassed = computed(() => !!githubToken && encryptor.passwdCorrect.value);

const inputToken = ref<string>(githubToken.value);
// 随时和githubToken保持一致，因为只有正确的值才会被赋给githubToken
watch(githubToken, (token) => {
  inputToken.value = token;
});
const inputPwd = ref<string>(encryptor.usePasswd.value);
const showModal = ref<boolean>(false);
const checkingToken = ref<boolean>(false);

const modalOk = () => {
  // 密码不用判断，直接修改
  encryptor.usePasswd.value = inputPwd.value;
  // 未改变token
  if (inputToken.value === githubToken.value) {
    showModal.value = false;
    return;
  }
  // 输入为空，则删除本地token
  if (!inputToken.value && !!githubToken.value) {
    notify({
      title: "删除Token成功",
      description: "已删除本地Github Token"
    });
    rmLocalStorage(GithubTokenKey);
    githubToken.value = inputToken.value;
    showModal.value = false;
    return;
  }
  checkingToken.value = true;
  isAuthor(inputToken.value)
    .then((res) => {
      notify({
        title: res ? "验证Token成功!" : "Token错误!",
        type: res ? "success" : "error",
        description: res ? "已将Github Token保存在本地" : null
      });
      if (res) {
        setLocalStorage(GithubTokenKey, inputToken.value);
        showModal.value = false;
      }
    })
    .catch((e) => {
      notify({
        title: "出错了",
        type: "error",
        description: e
      });
    })
    .finally(() => {
      checkingToken.value = false;
    });
};
</script>

<template>
  <div class="manage-background" />
  <div class="manage-container">
    <nav>
      <span class="mobile-menu-toggler" @click="toggleMenu()">
        <svg-icon :name="pageLoading.loadingState.value ? 'loading' : 'menu'" />
      </span>
      <div class="w100 flexc" :class="{hide: !menuShow}">
        <ul>
          <li>
            <nuxt-link
              to="/manage/config"
              :class="{ active: activeRoute.startsWith('/config') }"
            >
              配置
            </nuxt-link>
          </li>
          <li v-for="tab in HeaderTabs" :key="tab.url">
            <nuxt-link
              :to="'/manage' + tab.url"
              :class="{ active: activeRoute.startsWith(tab.url) }"
            >
              <span>{{ tab.name }}</span>
            </nuxt-link>
          </li>
        </ul>
        <div :title="!correctCommitId ? 'commitId不一致!' : allPassed ? '全部验证通过!':'token与密码'" @click="showModal = true">
          <svg-icon
            :class="{invalid: !correctCommitId, active: allPassed }"
            name="password"
          />
        </div>
        <nuxt-link title="🚀" :to="travle">
          <svg-icon name="rocket" />
        </nuxt-link>
        <span v-show="pageLoading.loadingState.value" class="loading">
          <svg-icon name="loading" />
        </span>
      </div>
    </nav>
    <section>
      <div>
        <nuxt-page />
      </div>
    </section>
  </div>
  <common-modal
    v-model="showModal"
    :loading="checkingToken"
    @confirm="modalOk"
    @cancel="inputToken = githubToken"
  >
    <template #title>
      Token & Password
    </template>
    <template #body>
      <label class="manage-input-pwd">
        <b>Github Token
          <svg-icon v-if="!!githubToken" name="correct" />
        </b>
        <input v-model="inputToken" :disabled="isDev">
      </label>
      <label class="manage-input-pwd">
        <b>密码
          <svg-icon v-if="encryptor.passwdCorrect.value" name="correct" />
        </b>
        <input v-model="inputPwd">
      </label>
    </template>
  </common-modal>
</template>

<style lang="scss">
@import "assets/style/var";

$menu-width: 100px;

.manage-container {
  $padding-left: 20px;

  > nav {
    position: fixed;
    left: $padding-left;
    top: 20px;
    z-index: 3;
    width: $menu-width - $padding-left;

    >.mobile-menu-toggler {
      display: none;
    }

    >div {
      transition: $common-transition;
      transform-origin: top;
      opacity: 1;

      ul {
        padding: 10px 0;
        width: 100%;
        box-shadow: 0 0 14px rgb(0 0 0 / 36%);
        list-style: none;
        background: #525252;
        overflow: hidden;
        border-radius: 2px;

        li {
          a {
            display: block;
            text-align: center;
            padding: 10px 0;
            font-size: 16px;
            text-decoration: none;
            color: rgb(255 255 255);
            transition: $common-transition;
            position: relative;

            &::before {
              position: absolute;
              z-index: 1;
              content: "";
              display: block;
              height: 100%;
              width: 2px;
              background: white;
              left: 0;
              top: 0;
              opacity: 0;
              transition: $common-transition;
            }

            &:hover {
              background: #6f6f6f;
            }

            &.active {
              background: #828282;

              &::before {
                opacity: 1;
              }
            }
          }
        }
      }

      > div,
      > a {
        display: flex;
        align-items: center;
        justify-content: center;

        @include square(40px);

        border-radius: 50%;
        background: white;
        box-shadow: 0 0 10px rgb(0 0 0 / 40%);
        margin-top: 18px;
        cursor: pointer;
        transition: $common-transition;

        &:hover {
          transform: scale(1.1);
        }

        > svg {
          @include square(24px);

          &.active {
            fill: #00ad15;
          }

          &.invalid {
            fill: red;
          }
        }

        img {
          border-radius: 50%;

          @include square(80%);
        }
      }

      >.loading {
        margin-top: 20px;

        >svg {
          fill: $theme-color-light;

          @include square(40px);
        }
      }
    }
  }

  > section {
    position: absolute;
    z-index: 2;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;

    > div {
      $left: $menu-width + $padding-left;

      height: 100%;
      width: calc(100% - #{$left + 30px});
      padding: 0 30px 0 $left;
    }
  }
}

.manage-background {
  position: fixed;
  z-index: 1;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #f5f5f5;
}

.manage-input-pwd {
  display: flex;
  flex-direction: column;

  &:first-of-type {
    margin-bottom: 25px;
  }

  b {
    margin-bottom: 10px;
    font-size: 13px;
    display: flex;
    align-items: center;

    > svg {
      @include square(15px);

      margin-left: 6px;
      fill: #06f;
    }
  }

  input {
    font-size: 15px;
    padding: 6px;
  }
}

@include mobile {
  .manage-container {
    > nav {
      top: 48px;
      left: 2%;

      >div.hide {
        transform: scaleY(0);
        opacity: 0.3;
        height: 0;
      }

      >div > .loading {
        display: none;
      }

      >.mobile-menu-toggler {
        display: flex;
        background: white;
        position: absolute;
        left: 0;
        top: 0;
        transform: translateY(-110%);
        border-radius: 50%;
        box-shadow: 0 0 10px rgb(0 0 0 / 30%);
        opacity: 0.8;

        >svg {
          @include square(36px);

          fill: #0087ff;
        }
      }
    }

    > section > div {
      width: 96%;
      padding-left: 2%;
      padding-right: 2%;
      padding-top: 20px;
    }
  }
}
</style>
