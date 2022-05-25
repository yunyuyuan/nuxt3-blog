export default defineNuxtPlugin(() => {
  return {
    provide: {
      isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
    }
  };
});
