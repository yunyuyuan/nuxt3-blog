<script setup lang="ts">
import { deleteList } from "ls:~/utils/manage/github";
import { Translation, CommonItem } from "~/utils/types";
import { formatTime } from "~/utils/_dayjs";
import { useStatusText } from "~/utils/manage";
import { useManageList } from "~/utils/manage/list";

const { targetTab, list, pending, customFilter } = useManageList();

const props = defineProps<{
  colPrefix: string;
  registryFilter?:(_: typeof customFilter) => void;
  // FIXME how to use Generic here?
  searchFn:(_item: object, _search: string) => boolean;
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
  navigateTo(`/manage${targetTab.url}/new`);
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
  const newList = list.filter((item) => {
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
    <input v-model="searchValue" placeholder="输入文字进行搜索">
    <div v-if="slots.filter" class="filter flex">
      <slot name="filter" />
    </div>
    <del style="margin: 0 auto;" />
    <span class="status">{{ statusText }}</span>
    <common-button class="add-item" icon="add" @click="newItem">
      新建
    </common-button>
    <common-button
      icon="delete"
      theme="danger"
      :disabled="!canCommit || !selectedList.length"
      :loading="processing"
      @click="showConfirmModal = true"
    >
      删除
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
        {{ Translation[head] }}
      </div>
      <div class="col col-time">
        日期
      </div>
      <div class="col col-lock">
        加密
      </div>
      <div class="col col-check">
        选择
      </div>
    </li>
    <common-loading v-if="pending" />
    <li
      v-for="item in searchedList"
      v-else
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
      <div class="col col-lock" :title="item.encrypt ? '已加密' : null">
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
      确认删除
    </template>
    <template #body>
      <p>
        已选择<b style="margin: 0 8px; font-size: 1.1em;">{{
          selectedList.length
        }}</b>项
      </p>
    </template>
  </common-modal>
</template>

<style lang="scss">
@import "assets/style/var";

.manage-list-head,
.manage-list-table {
  max-width: 1200px;
}

.manage-list-head {
  margin: 0 auto 10px;
  padding-top: 30px;

  input {
    padding: 7px;
    font-size: 15px;
    width: 288px;
  }

  > .filter {
    margin-left: 8px;
    font-size: 13px;
    flex-wrap: wrap;

    &::before {
      content: "筛选：";
    }
  }

  > span {
    font-size: 13px;
    margin: 0 15px 0 0;
    color: #b80000;
  }

  > .add-item {
    margin: 0 12px 0 0;
  }
}

.manage-list-table {
  border: 1px solid #dbdbdb;
  box-shadow: 0 0 15px #e0e0e0;
  border-radius: 4px;
  overflow: hidden;
  margin: 0 auto 30px;

  li {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: rgb(255 255 255);
    padding: 26px 30px;
    border-radius: 2px;
    transition: $common-transition;
    border-bottom: 1px solid #d8d8d8;

    &.list-head {
      background: #ebebeb;
      padding-top: 20px;
      padding-bottom: 20px;

      .col {
        font-size: 15px !important;
        font-weight: bold !important;
        font-style: italic;
        color: #4c4c4c;
      }
    }

    &.list-body:hover {
      background: rgb(251 254 255 / 98%);
    }

    .col {
      flex-grow: 0;
      flex-shrink: 0;

      a[href] {
        color: black;
        text-decoration: none;
        display: block;

        &:hover {
          text-decoration: underline;
        }
      }

      &-id {
        flex-basis: 6%;
        font-size: 14px;
        font-family: $font-code;
        font-weight: 600;
      }

      &-title {
        a {
          @include textoverflow;
        }
      }

      &-time {
        flex-basis: 14%;

        span {
          font-size: 12px;
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
