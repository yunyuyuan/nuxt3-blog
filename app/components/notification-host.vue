<script setup lang="ts">
import CommonNotification from "~/utils/nuxt/notify/common-notification.vue";
import { notifyEntries, removeNotification } from "~/utils/nuxt/notify";
import { NotificationContainerId } from "~/utils/common/constants";
</script>

<template>
  <!-- notify() 发出的通知，渲染到 all.client.ts 创建的通知容器中 -->
  <teleport :to="`#${NotificationContainerId}`">
    <common-notification
      v-for="item in notifyEntries"
      :key="item.id"
      :type="item.type"
      :title="item.title"
      :description="item.description"
      @destroy="removeNotification(item.id)"
    />
  </teleport>
</template>
