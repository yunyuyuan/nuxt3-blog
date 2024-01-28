<script setup lang="ts">
import ManageContentEdit from "~/pages/manage/comps/manage-content-edit.vue";
import { type RecordItem, getUniqueId } from "~/utils/common";

const moveUpImg = (idx: number, item: RecordItem) => {
  item.images.splice(idx - 1, 2, item.images[idx], item.images[idx - 1]);
};
const rmImg = (idx: number, item: RecordItem) => {
  item.images.splice(idx, 1);
};
const addImg = (item: RecordItem) => {
  item.images.push({ src: "", alt: "", id: getUniqueId() });
};

const processImages = (_: any, _2: any, item: RecordItem) => {
  // 删除id
  item.images.forEach((img) => {
    delete img.id;
  });
};
</script>

<template>
  <div class="manage-record-detail">
    <manage-content-edit :process-with-content="processImages">
      <template #images="{ disabled, item }">
        <span :class="{invalid: item.images.some(img => !img.src)}">
          <b>{{ $T('images') }}</b>
          <svg-icon name="images" />
        </span>
        <div class="input-images flexc">
          <ul>
            <li v-for="(img, idx) in item.images" :key="img.id" class="flex">
              <input
                v-model="img.src"
                class="input-src"
                :disabled="disabled"
                placeholder="src"
              >
              <input
                v-model="img.alt"
                class="input-alt"
                :disabled="disabled"
                placeholder="alt"
              >
              <div class="flex">
                <common-button
                  v-if="idx !== 0"
                  :disabled="disabled"
                  class="move-up"
                  theme="default"
                  size="small"
                  icon="up"
                  @click="moveUpImg(idx, item)"
                />
                <common-button
                  :disabled="disabled"
                  theme="danger"
                  size="small"
                  icon="delete"
                  @click="rmImg(idx, item)"
                />
              </div>
            </li>
            <li>
              <common-button
                :disabled="disabled"
                class="add-new"
                icon="add"
                @click="addImg(item)"
              />
            </li>
          </ul>
        </div>
      </template>
    </manage-content-edit>
  </div>
</template>

<style lang="scss">
.manage-record-detail {
  .input-images {
    align-items: flex-start;

    ul {
      list-style: none;

      li {
        margin-bottom: 10px;

        input {
          flex-grow: 0;
        }

        .input-src {
          width: 360px;
          font-size: f-size(0.8);
        }

        .input-alt {
          width: 100px;
          font-size: f-size(0.8);
          margin: 0 10px;
        }

        >div {
          .move-up {
            margin-right: 10px;
          }
        }

        .add-new {
          width: 80px;
        }
      }
    }
  }
}

@include mobile {
  .manage-record-detail {
    .input-images {
      ul {
        li {
          .input-src {
            width: 50%;
            flex-grow: 1;
          }

          .input-alt {
            width: 20%;
          }

          >div {
            width: 70px;
          }
        }
      }
    }
  }
}
</style>
