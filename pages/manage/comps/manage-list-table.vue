<script setup lang="ts" generic="T extends CommonItem">
import { deleteList } from "ls:~/utils/nuxt/manage/github";
import { type CommonItem } from "~/utils/common";
import { formatTime, useStatusText, useManageList } from "~/utils/nuxt";

const { targetTab, list, customFilter } = await useManageList<T>();

const props = defineProps<{
  colPrefix: string;
  registryFilter?:(_: (_: (_: T) => boolean) => void) => void,
  searchFn:(_item: T, _search: string) => boolean;
}>();

if (props.registryFilter) {
  props.registryFilter(customFilter);
}

const slots = useSlots();
const header = Object.keys(slots).filter(
  key => !key.startsWith("_") && !key.includes("filter")
);

const searchValue = ref<string>("");
const searchedList = computed(() => {
  return list.filter((item) => {
    return props.searchFn(item, searchValue.value);
  });
});

// 新建
const newItem = () => {
  navigateTo((`/manage${targetTab.url}/new`));
};

// 删除
const showConfirmModal = ref<boolean>(false);
const selectedList = reactive<CommonItem[]>([]);

// status
const { statusText, canCommit, processing, toggleProcessing } = useStatusText();

watch([list, searchValue], () => {
  selectedList.splice(0, selectedList.length);
});

function changeSelect (item: CommonItem) {
  if (selectedList.includes(item)) {
    selectedList.splice(selectedList.indexOf(item), 1);
  } else {
    selectedList.push(item);
  }
}
function deleteSelect () {
  showConfirmModal.value = false;
  toggleProcessing();
  const newList = list.map((item) => {
    delete (item as any)._show;
    return item;
  }).filter((item) => {
    return (
      selectedList.find(selected => selected.id === item.id) === undefined
    );
  });
  deleteList(newList, selectedList).finally(() => {
    toggleProcessing();
  });
}
</script>

<template>
  <div class="manage-list-head flex">
    <input v-model="searchValue" :placeholder="$T('input-text-to-search')">
    <div v-if="slots.filter" class="filter flex">
      <slot name="filter" />
    </div>
    <del style="margin: 0 auto;" />
    <span class="status">{{ statusText }}</span>
    <common-button class="add-item" icon="add" @click="newItem">
      {{ $T('new') }}
    </common-button>
    <common-button
      icon="delete"
      theme="danger"
      :disabled="!canCommit || !selectedList.length"
      :loading="processing"
      @click="showConfirmModal = true"
    >
      {{ $T('del') }}
    </common-button>
  </div>
  <ul class="manage-list-table">
    <li class="list-head">
      <div class="col col-id">
        ID
      </div>
      <div
        v-for="head in header"
        :key="head"
        class="col"
        :class="['col-' + head, colPrefix + head]"
      >
        {{ $T(head) }}
      </div>
      <div class="col col-time">
        {{ $T('date') }}
      </div>
      <div class="col col-lock">
        {{ $T('encrypted') }}
      </div>
      <div class="col col-check">
        {{ $T('select') }}
      </div>
    </li>
    <div v-if="!searchedList.length" class="flex empty">
      {{ $t('nothing-here') }}
    </div>
    <li
      v-for="item in searchedList"
      v-show="item._show"
      :key="item.id"
      class="list-body"
    >
      <div class="col col-id">
        {{ item.id }}
      </div>
      <div
        v-for="key in header"
        :key="key"
        class="col"
        :class="['col-' + key, colPrefix + key]"
      >
        <slot
          :name="key"
          :data="item[key]"
          :data-url="`/manage${targetTab.url}/${item.id}`"
        />
      </div>
      <div class="col col-time">
        <span>{{ formatTime(item.time) }}</span>
      </div>
      <div class="col col-lock" :title="item.encrypt ? $t('has-encrypted') : undefined">
        <svg-icon v-if="item.encrypt" name="lock" />
      </div>
      <div class="col col-check">
        <common-checkbox
          :checked="selectedList.includes(item)"
          @change="changeSelect(item)"
        />
      </div>
    </li>
  </ul>
  <common-modal
    v-model="showConfirmModal"
    confirm-theme="danger"
    @confirm="deleteSelect"
  >
    <template #title>
      {{ $T('confirm-delete') }}
    </template>
    <template #body>
      <p v-html="$t('selected-items', [selectedList.length])" />
    </template>
  </common-modal>
</template>

<style lang="scss">
.manage-list-head,
.manage-list-table {
  max-width: 1200px;
}

.manage-list-head {
  margin: 0 auto 10px;
  padding-top: 30px;

  input {
    padding: 7px;
    font-size: f-size(0.8);
    width: 288px;
  }

  > .filter {
    margin-left: 8px;
    font-size: f-size(0.75);
    flex-wrap: wrap;

    &::before {
      content: "筛选：";
    }
  }

  > span {
    font-size: f-size(0.75);
    margin: 0 15px 0 0;
    color: #b80000;

    @include dark-mode {
      color: #ffa6a6;
    }
  }

  > .add-item {
    margin: 0 12px 0 0;
  }
}

.manage-list-table {
  border: 1px solid #dbdbdb;
  box-shadow: 0 0 15px #e0e0e0;

  @include dark-mode {
    border-color: rgb(95 95 95);
    box-shadow: 0 0 15px #2b2b2b;
  }

  border-radius: 4px;
  overflow: hidden;
  margin: 0 auto 30px;

  .empty {
    font-size: f-size(1);
    font-weight: bold;
    justify-content: center;
    padding: 50px 0;
  }

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgb(255 255 255);

    @include dark-mode {
      background: rgb(36 36 36);
      border-color: rgb(105 105 105);
    }

    padding: 26px 30px;
    border-radius: 2px;
    transition: $common-transition;
    border-bottom: 1px solid #d8d8d8;

    &.list-head {
      background: #ebebeb;

      @include dark-mode {
        background: rgb(54 54 54);
      }

      padding-top: 20px;
      padding-bottom: 20px;

      .col {
        font-size: f-size(0.85) !important;
        font-weight: bold !important;
        font-style: italic;
        color: #4c4c4c;

        @include dark-mode {
          color: white;
        }
      }
    }

    &.list-body:hover {
      background: rgb(251 254 255 / 98%);

      @include dark-mode {
        background: #363636;
      }
    }

    .col {
      flex-grow: 0;
      flex-shrink: 0;

      a[href] {
        color: black;
        text-decoration: none;
        display: block;

        @include dark-mode {
          color: white;
        }

        &:hover {
          text-decoration: underline;
        }
      }

      &-id {
        flex-basis: 6%;
        font-size: f-size(0.75);
        font-family: $font-code;
        font-weight: 600;
      }

      &-title {
        a {
          @include textoverflow;

          font-weight: 500;
        }
      }

      &-time {
        flex-basis: 14%;

        span {
          font-size: f-size(0.7);
          text-align: center;
        }
      }

      &-lock,
      &-check {
        flex-basis: 5%;
      }

      &-lock {
        svg {
          @include square(15px);

          @include dark-mode {
            fill: rgb(194 194 194);
          }
        }
      }
    }
  }

  .common-loading {
    margin: 20px 0;
  }
}

@include mobile {
  .manage-list-head {
    position: relative;

    input {
      width: 128px;
    }

    >span {
      position: absolute;
      margin: 0;
      right: 0;
      top: 0;
    }
  }

  .manage-list-table {
    li {
      padding-left: 7px;
      padding-right: 7px;
    }
  }
}
</style>
