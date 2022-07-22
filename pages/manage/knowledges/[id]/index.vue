<script setup lang="ts">
import {
  KnowledgeTabs,
  KnowledgeTabsList,
  Translation
} from "~/utils/types";
import ManageContentEdit from "~/comps/manage-content-edit.vue";

const typeSelectShow = ref(false);
const typeSelectHided = ref(true);
</script>

<template>
  <div class="manage-knowledge-detail">
    <manage-content-edit>
      <template #title="{ disabled, item }">
        <div>
          <span :class="{ invalid: !item.title }">{{ Translation.title }}
            <svg-icon name="title" />
          </span>
          <input v-model="item.title" :disabled="disabled">
        </div>
      </template>
      <template #type="{ disabled, item }">
        <div>
          <span>{{ Translation.type }}
            <svg-icon name="type" />
          </span>
          <div class="select" @click="!disabled && typeSelectHided && (typeSelectShow = true)">
            <a tabindex="1" class="flex" :class="{active: !typeSelectHided, disabled: disabled}">
              {{ KnowledgeTabsList.find((i) => i.key === item.type).name }}
              <svg-icon :name="item.type" />
            </a>
            <common-dropdown v-model:show="typeSelectShow" v-model:hided="typeSelectHided" class="flexc">
              <div v-for="tp in KnowledgeTabs" :key="tp" class="flex" :class="{active: item.type===tp}" @click="item.type=tp;typeSelectShow=false">
                <span>{{ KnowledgeTabsList.find((i) => i.key === tp).name }}</span>
                <svg-icon :name="tp" />
              </div>
            </common-dropdown>
          </div>
        </div>
      </template>
      <template #link="{ disabled, item }">
        <div>
          <span :class="{ invalid: !item.link }">{{ Translation.link }}
            <svg-icon name="link" />
          </span>
          <input v-model="item.link" :disabled="disabled">
        </div>
      </template>
      <template #cover="{ disabled, item }">
        <div>
          <span :class="{ invalid: !item.cover }">{{ Translation.cover }}
            <svg-icon name="images" />
          </span>
          <input v-model="item.cover" :disabled="disabled">
        </div>
      </template>
      <template #summary="{ disabled, item }">
        <div class="base-info-summary">
          <span :class="{ invalid: !item.summary }">{{ Translation.summary }}
            <svg-icon name="summary" />
          </span>
          <textarea v-model="item.summary" :disabled="disabled" />
        </div>
      </template>
    </manage-content-edit>
  </div>
</template>

<style lang="scss">
@import "assets/style/var";

.manage-knowledge-detail {
  .base-info-summary {
    align-items: flex-start;
  }

  .select {
    flex-direction: row !important;
    position: relative;

    > a {
      padding: 0 8px;
      border: 1px solid gray;
      transition: border $animation-duration $animation-function, box-shadow $animation-duration $animation-function;
      border-radius: 2px;
      background: #fff;
      cursor: pointer;

      &:hover {
        border-color: black;
      }

      &.active {
        box-shadow: 0 0 4px rgba($theme-color-lighten, 20%);
        border-color: $theme-color;
        background: white;
      }

      &.disabled {
        cursor: not-allowed;
        border-color: #a5a5a5;
        background: rgb(239 239 239);
      }

      > svg {
        @include square(32px);

        margin-left: 10px;
      }
    }

    .common-dropdown {
      width: 100%;
      align-items: stretch;

      > div {
        justify-content: space-around;
        padding: 4px;
        transition: $common-transition;
        cursor: pointer;

        &:first-of-type {
          border-top-left-radius: inherit;
          border-top-right-radius: inherit;
        }

        &:last-of-type {
          border-bottom-left-radius: inherit;
          border-bottom-right-radius: inherit;
        }

        &:not(.active):hover {
          background: rgb(230 230 230);
        }

        &.active {
          background: $theme-color-lighten;
        }

        &:not(:last-of-type) {
          border-bottom: 1px solid rgb(199 199 199);
        }

        span {
          font-size: 14px;
          word-break: keep-all;
        }

        svg {
          @include square(26px);
        }
      }
    }
  }
}
</style>
