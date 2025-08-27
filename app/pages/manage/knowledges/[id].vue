<script setup lang="ts">
import { Blocks, BookMarked, Captions, Image, Link } from "lucide-vue-next";
import ManageContentEdit from "~/pages/manage/comps/manage-content-edit.vue";
import { KnowledgeColorMap, KnowledgeIconMap, KnowledgeTabs, KnowledgeTabsList, type KnowledgeItem } from "~/utils/common/types";

const typeSelectShow = ref(false);

const preProcessItem = (_: Ref<KnowledgeItem>) => { };
</script>

<template>
  <manage-content-edit :pre-process-item="preProcessItem">
    <template #title="{ disabled, item }">
      <div>
        <span :class="!item.title && 'form-item-invalid'">
          <Captions class="size-5" />
          {{ $t('title') }}
        </span>
        <input
          v-model="item.title"
          :placeholder="$t('please-input')"
          :disabled="disabled"
        >
      </div>
    </template>
    <template #type="{ disabled, item }">
      <div>
        <span>
          <Blocks class="size-5" />
          {{ $t('type') }}
        </span>
        <div
          class="relative"
          @click="!disabled && (typeSelectShow = true)"
        >
          <button
            tabindex="1"
            class="flex items-center gap-2 rounded-lg border border-dark-300 bg-dark-50 px-4 py-1 text-sm shadow-sm transition hover:border-primary-400 dark:border-dark-600 dark:bg-dark-700 dark:hover:border-primary-500"
            :disabled="disabled"
          >
            {{ $t(KnowledgeTabsList.find((i) => i.key === item.type)!.name) }}
            <span
              :class="twMerge(
                'rounded-full p-2',
                KnowledgeColorMap[item.type]
              )"
            >
              <component
                :is="KnowledgeIconMap[item.type]"
                class="size-4"
              />
            </span>
          </button>
          <common-dropdown v-model:show="typeSelectShow">
            <div class="flex flex-col p-2">
              <button
                v-for="tp in KnowledgeTabs"
                :key="tp"
                class="flex items-center gap-2 px-4 py-1 transition hover:text-primary-500"
                @click="item.type=tp;typeSelectShow=false"
              >
                {{ $t(KnowledgeTabsList.find((i) => i.key === tp)!.name) }}
                <span
                  :class="twMerge(
                    'p-2 rounded-full',
                    KnowledgeColorMap[tp]
                  )"
                >
                  <component
                    :is="KnowledgeIconMap[tp]"
                    class="size-4"
                  />
                </span>
              </button>
            </div>
          </common-dropdown>
        </div>
      </div>
    </template>
    <template #link="{ disabled, item }">
      <div>
        <span :class="!item.link && 'form-item-invalid'">
          <Link class="size-5" />
          {{ $t('link') }}
        </span>
        <input
          v-model="item.link"
          :placeholder="$t('please-input')"
          :disabled="disabled"
        >
      </div>
    </template>
    <template #cover="{ disabled, item }">
      <div>
        <span :class="!item.cover && 'form-item-invalid'">
          <Image class="size-5" />
          {{ $t('cover') }}
        </span>
        <input
          v-model="item.cover"
          :placeholder="$t('please-input')"
          :disabled="disabled"
        >
      </div>
    </template>
    <template #summary="{ disabled, item }">
      <div>
        <span :class="!item.summary && 'form-item-invalid'">
          <BookMarked class="size-5" />
          {{ $t('summary') }}
        </span>
        <textarea
          v-model="item.summary"
          :placeholder="$t('please-input')"
          rows="4"
          :disabled="disabled"
        />
      </div>
    </template>
  </manage-content-edit>
</template>
