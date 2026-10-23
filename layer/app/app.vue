<template>
  <!-- 与 Nuxt 默认的 app.vue 相同，另外挂载 openModal() 和 notify() 的渲染位置 -->
  <NuxtLayout>
    <NuxtRouteAnnouncer />
    <NuxtPage />
  </NuxtLayout>
  <ClientOnly>
    <ModalHost />
    <NotificationHost />
  </ClientOnly>
</template>
