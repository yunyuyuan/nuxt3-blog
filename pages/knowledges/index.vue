<script setup lang="ts">
import { formatTime, literalTime, useHackKey, useListPage } from "~/utils/nuxt";
import { type KnowledgeItem, KnowledgeTabs, KnowledgeTabsList } from "~/utils/common";

const hackKey = useHackKey();

const knowledgeList = await useListPage<KnowledgeItem>();

const currentTab = computed(() => (useRoute().query.type as string) || "");
const isAll = computed(
  () => !(KnowledgeTabs as string[]).includes(currentTab.value)
);

const tabs = computed(() => [
  { name: "all", key: "", active: isAll.value },
  ...KnowledgeTabsList.map(item => ({ ...item, active: currentTab.value === item.key }))
]);

const filteredList = computed(() => {
  if (!isAll.value) {
    return knowledgeList.filter(item => item.type === currentTab.value);
  }
  return knowledgeList;
});
const filteredListEmpty = computed(() => !filteredList.value.some(i => i._show));

function getFilteredListLength (tab?: string) {
  return knowledgeList.filter(item => item._show && (!tab || item.type === tab)).length;
}
function goTo (tab?: string) {
  navigateTo({ query: { type: tab } }, { replace: true });
}

</script>

<template>
  <div class="knowledge-list">
    <nav class="flex">
      <span v-for="tab in tabs" :key="tab.key + hackKey" :class="{ active: tab.active }" @click="goTo(tab.key)">
        {{ $T(tab.name) }}
        <b>{{ getFilteredListLength(tab.key) }}</b>
      </span>
    </nav>
    <div class="body flexc">
      <div v-if="!filteredListEmpty">
        <nuxt-link
          v-for="item in filteredList"
          v-show="item._show"
          :key="item.id"
          no-prefetch
          :to="'/knowledges/' + item.id"
        >
          <svg-icon :name="item.type" />
          <span>《<b>{{ item.title }}</b>》</span>
          <time :title="formatTime(item.time)">{{ literalTime(item.time) }}</time>
        </nuxt-link>
      </div>
      <div v-else class="empty">
        {{ $T('nothing-here') }}
      </div>
    </div>
  </div>
</template>

<style lang="scss">
$space: 16px;

.knowledge-list {
  width: 800px;
  padding-bottom: 60px;

  nav {
    width: 100%;
    border-bottom: 1px solid #b4b4b4;
    justify-content: center;
    margin: 40px auto 10px;

    > span {
      cursor: pointer;
      transition: $common-transition;
      border-radius: 6px 6px 0 0;
      font-size: f-size(0.85);
      padding: 5px 10px;
      display: flex;
      align-items: center;

      @include dark-mode {
        &:not(.active):hover {
          background: #5c5c5c;
        }
      }

      &:not(.active):hover {
        background: #e1e1e1;
      }

      &.active {
        background: $theme-color;

        @include dark-mode {
          background: $theme-color-darken;
        }

        color: white;
        box-shadow: 0 0 2px rgb(0 0 0 / 30%);
      }

      b {
        font-size: f-size(0.75);
        width: 25px;
        height: 17px;
        line-height: 17px;
        text-align: center;
        background: #f3884a;
        color: white;
        border-radius: 8px;
        margin-left: 4px;
      }
    }
  }

  .body {
    width: 88%;
    margin: auto;

    .common-loading {
      margin-top: calc(50vh - $header-height);
      transform: translateY(-100%);
    }

    > div {
      width: 100%;
    }

    a {
      display: flex;
      align-items: center;
      width: 100%;
      text-decoration: none;
      padding: $space * 1.6 0 $space * 1.2 0;
      transition: $common-transition;
      border-radius: 5px;
      position: relative;

      &::after {
        content: "";
        width: 100%;
        height: 1px;
        position: absolute;
        bottom: 0;
        left: 0;
        background: #f3f3f3;

        @include dark-mode {
          background: rgb(129 129 129);
        }
      }

      &:not(:last-of-type) {
        margin-bottom: 8px;
      }

      svg {
        @include square(22px);

        margin: 0 8px;
        flex-shrink: 0;
      }

      span {
        position: relative;
        font-size: f-size(0.7);
        display: flex;
        align-items: center;
        overflow: hidden;
        padding: 5px;

        @include dark-mode {
          color: white;
        }

        &::after {
          position: absolute;
          left: 10px;
          bottom: 0;
          content: "";
          width: calc(100% - 20px);
          height: 1.5px;
          background: #00a4a4;
          opacity: 0;
          transition: $common-transition;
        }

        b {
          font-size: f-size();
          color: black;
          font-weight: 500;

          @include dark-mode {
            color: white;
          }

          margin: 0 4px;
          line-height: 22px;

          @include textoverflow;
        }
      }

      time {
        font-size: f-size(0.72);
        color: #696969;

        @include dark-mode {
          color: rgb(202 202 202);
        }

        margin: 0 5px 0 auto;
        transition: $common-transition;
        word-break: keep-all;
      }

      &:hover {
        span::after {
          opacity: 1;
        }

        time {
          color: #000;
        }
      }
    }

    .empty {
      color: rgb(53 53 53);
      text-align: center;
      font-size: 1rem;

      @include dark-mode {
        color: rgb(212 212 212);
      }

      margin-top: 20px;
    }
  }
}

@include mobile {
  .knowledge-list {
    width: 100%;

    nav,
    .body {
      width: calc(100% - 20px);
    }
  }
}
</style>
