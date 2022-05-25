export default defineNuxtPlugin(() => {
  const unSavedContent = useUnsavedContent();
  window.onbeforeunload = () => {
    if (unSavedContent.value) {
      return "你的内容尚未保存，确定要离开吗？";
    }
  };
  addRouteMiddleware("unload", () => {
    if (unSavedContent.value) {
      if (!confirm("你的内容尚未保存，确定要离开吗？")) {
        return abortNavigation();
      }
      unSavedContent.value = false;
    }
  }, { global: true });
});
