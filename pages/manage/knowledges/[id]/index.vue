<script setup lang="ts">
import ManageContentEdit from "~/pages/manage/comps/manage-content-edit.vue";
import { KnowledgeTabs, KnowledgeTabsList } from "~/utils/common";

const typeSelectShow = ref(false);
</script>

<template>
  <div class="manage-knowledge-detail">
    <manage-content-edit>
      <template #title="{ disabled, item }">
        <span :class="{ invalid: !item.title }">
          <b>{{ $T('title') }}</b>
          <svg-icon name="title" />
        </span>
        <input v-model="item.title" :placeholder="$t('please-input')" :disabled="disabled">
      </template>
      <template #type="{ disabled, item }">
        <span>
          <b>{{ $T('type') }}</b>
          <svg-icon name="type" />
        </span>
        <div class="select" @click="!disabled && (typeSelectShow = true)">
          <a tabindex="1" class="flex" :class="{active: typeSelectShow, disabled: disabled}">
            <b>{{ $T(KnowledgeTabsList.find((i) => i.key === item.type)!.name) }}</b>
            <svg-icon :name="item.type" />
          </a>
          <common-dropdown v-model:show="typeSelectShow" class="flexc">
            <div v-for="tp in KnowledgeTabs" :key="tp" class="flex" :class="{active: item.type===tp}" @click="item.type=tp;typeSelectShow=false">
              <span>{{ $T(KnowledgeTabsList.find((i) => i.key === tp)!.name) }}</span>
              <svg-icon :name="tp" />
            </div>
          </common-dropdown>
        </div>
      </template>
      <template #link="{ disabled, item }">
        <span :class="{ invalid: !item.link }">
          <b>{{ $T('link') }}</b>
          <svg-icon name="link" />
        </span>
        <input v-model="item.link" :placeholder="$t('please-input')" :disabled="disabled">
      </template>
      <template #cover="{ disabled, item }">
        <span :class="{ invalid: !item.cover }">
          <b>{{ $T('cover') }}</b>
          <svg-icon name="images" />
        </span>
        <input v-model="item.cover" :placeholder="$t('please-input')" :disabled="disabled">
      </template>
      <template #summary="{ disabled, item }">
        <span :class="{ invalid: !item.summary }">
          <b>{{ $T('summary') }}</b>
          <svg-icon name="summary" />
        </span>
        <textarea v-model="item.summary" :placeholder="$t('please-input')" :disabled="disabled" />
      </template>
    </manage-content-edit>
  </div>
</template>

<style lang="scss">
.manage-knowledge-detail {
  .select {
    flex-direction: row !important;
    position: relative;
    max-width: 100px;
    min-width: unset;

    > a {
      padding: 0 8px;
      border: 1px solid #a1a1a1;
      transition: border $animation-duration $animation-function, box-shadow $animation-duration $animation-function;
      border-radius: 2px;
      background: #fff;
      color: black;
      cursor: pointer;

      @include dark-mode {
        background: rgb(54 54 54);
        color: rgb(255 255 255);

        &:hover {
          border-color: white;
        }
      }

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

        @include dark-mode {
          &:not(.active):hover {
            background: rgb(75 75 75);
          }

          &.active {
            background: $theme-color-darken;
          }
        }

        &:not(:last-of-type) {
          border-bottom: 1px solid rgb(199 199 199);
        }

        span {
          font-size: f-size(0.8);
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
