<script setup lang="tsx">
import SvgIcon from "~/components/svg-icon.vue";
import NuxtLink from "~/node_modules/nuxt/dist/app/components/nuxt-link";
import UploadImage from "~/pages/manage/comps/upload-image.vue";
import { rmLocalStorage, setLocalStorage, translateT, isAuthor, notify, translate, isDev, calcRocketUrl } from "~/utils/nuxt";
import { GithubTokenKey, HeaderTabs } from "~/utils/common";

const pageLoading = useLoading();

// 上传图片
const showUploadImage = ref(false);
const githubToken = useGithubToken();
const encryptor = useEncryptor();
const allPassed = computed(() => !!githubToken && encryptor.passwdCorrect.value);

const activeRoute = computed(() => {
  return useRoute().path.replace(/^\/manage\//, "/");
});
const travel = computed(() => {
  return calcRocketUrl();
});
// mobile menu
const isMobile = useIsMobile();
const menuShow = ref<boolean>(false);
watch(isMobile, () => {
  setTimeout(() => {
    menuShow.value = false;
  });
});

const ManageMenu = defineComponent({
  components: {
    // eslint-disable-next-line vue/no-unused-components
    "nuxt-link": NuxtLink,
    "svg-icon": SvgIcon
  },
  render: () => (
    <div class="manage-menu w100 flexc">
      <ul>
        <li>
          <a class="upload-img-btn" onClick={() => { showUploadImage.value = true; }}>
            { translateT("images") }
          </a>
        </li>
        <li>
          <nuxt-link
            to='/manage/config'
            class={{ active: activeRoute.value.startsWith("/config") }}
          >
            { translateT("config") }
          </nuxt-link>
        </li>
        {
          HeaderTabs.map(tab => (
            <li key={tab.url}>
              <nuxt-link
                to={"/manage" + tab.url}
                class={{ active: activeRoute.value.startsWith(tab.url) }}
              >
                <span>{ translateT(tab.name) }</span>
              </nuxt-link>
            </li>
          ))
        }
      </ul>
      <div
        title={(!useCorrectSha().value || useNuxtApp().$sameSha.value) ? (allPassed.value ? translate("all-verified") : translate("token-and-passwd")) : translate("commit-id-not-correct")}
        class={{ warning: useCorrectSha().value && !useNuxtApp().$sameSha.value }}
        onClick={() => { showModal.value = true; }}
      >
        <svg-icon
          class={{ invalid: !githubToken.value, active: allPassed.value }}
          name="password"
        />
      </div>
      <nuxt-link title="🚀" to={travel.value}>
        <svg-icon name="rocket" />
      </nuxt-link>
      {
        isDev &&
      <nuxt-link title="svgs" to="/manage/all-svg" target="_blank">
        SVG
      </nuxt-link>
      }
      {
        (pageLoading.loadingState.value && !isMobile.value)
          ? <div>
            <svg-icon name="loading"/>
          </div>
          : null
      }
    </div>
  )
});

// 进入manage界面后，大概率会用到encrypt，所以这里先异步加载，尚未遇到bug
encryptor.init();

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
      title: translate("token-deleted"),
      description: translate("token-deleted-from-local")
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
        title: res ? translate("token-verified") : translate("token-unverified"),
        type: res ? "success" : "error",
        description: res ? translate("token-saved") : undefined
      });
      if (res) {
        setLocalStorage(GithubTokenKey, inputToken.value);
        showModal.value = false;
      }
    })
    .catch((e) => {
      notify({
        title: translate("error"),
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
      <span class="mobile-menu-toggler" @click="menuShow = true">
        <svg-icon :name="pageLoading.loadingState.value ? 'loading' : 'menu'" />
      </span>
      <manage-menu v-show="!isMobile" />
      <div v-show="isMobile">
        <common-dropdown v-model:show="menuShow">
          <manage-menu />
        </common-dropdown>
      </div>
    </nav>
    <section>
      <div>
        <client-only>
          <nuxt-page />
        </client-only>
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
        <input v-model="inputToken" :placeholder="$t('please-input')" data-focus :disabled="isDev">
      </label>
      <label class="manage-input-pwd">
        <b>
          {{ $T('passwd') }}
          <svg-icon v-if="encryptor.passwdCorrect.value" name="correct" />
        </b>
        <input v-model="inputPwd" :placeholder="$t('please-input')">
      </label>
    </template>
  </common-modal>
  <upload-image v-model="showUploadImage" />
</template>

<style lang="scss">
$menu-width: 120px;

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

    .common-dropdown {
      background: transparent;
      box-shadow: none;
      border: none;
      width: $menu-width - $padding-left;
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
      width: 100%;
      padding: 0 30px 0 $left;

      > div {
        padding-bottom: 20px;
      }
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
  background: #fbfbfb;

  @include dark-mode {
    background: $background-dark;
  }
}

.manage-menu {
  ul {
    padding: 10px 0;
    width: 100%;
    box-shadow: 0 0 14px rgb(0 0 0 / 36%);
    list-style: none;
    background: #525252;
    overflow: hidden;
    border-radius: 2px;

    @include dark-mode {
      box-shadow: 0 0 14px rgb(107 107 107 / 36%);
      background: #202020;
    }

    li {
      .upload-img-btn {
        cursor: cell;
      }

      a {
        display: block;
        text-align: center;
        padding: 10px 0;
        font-size: f-size(1);
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

          @include dark-mode {
            background: rgb(202 202 202);
          }
        }

        &:hover {
          background: #6f6f6f;
        }

        &.active {
          background: $theme-color;

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
    text-decoration: none;
    font-size: f-size(0.8);
    color: $theme-color-darken;
    font-weight: bold;

    @include dark-mode {
      background: rgb(235 235 235);
    }

    &:hover {
      transform: scale(1.1);
    }

    &.warning {
      background: rgb(255 255 153);
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
      fill: $theme-color;

      @include square(40px);
    }
  }
}

.manage-input-pwd {
  display: flex;
  flex-direction: column;

  &:first-of-type {
    margin-bottom: 25px;
  }

  b {
    margin-bottom: 6px;
    font-size: f-size(0.8);
    display: flex;
    align-items: center;

    > svg {
      @include square(15px);

      margin-left: 6px;
      fill: #06f;
    }
  }

  input {
    font-size: f-size(0.85);
    padding: 6px;
  }
}

@include mobile {
  .manage-container {
    > nav {
      top: 48px;
      left: 2%;

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
      padding-left: 2%;
      padding-right: 2%;
      padding-top: 20px;
    }
  }
}
</style>
