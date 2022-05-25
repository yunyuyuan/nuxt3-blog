<script setup lang="ts">
import {
  KnowledgeTabs,
  KnowledgeTabsList,
  Translation
} from "~/utils/types";
import ManageContentEdit from "~/comps/manage-content-edit.vue";
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
          <div class="select flex">
            <select v-model="item.type" :disabled="disabled">
              <option v-for="tp in KnowledgeTabs" :key="tp" :value="tp">
                {{ KnowledgeTabsList.find((i) => i.key === tp).name }}
              </option>
            </select>
            <svg-icon :name="item.type" />
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
    svg {
      @include square(32px);

      margin-left: 10px;
    }
  }
}
</style>
