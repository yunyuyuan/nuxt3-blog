import throttle from "lodash/throttle";

export default defineNuxtPlugin(() => {
  const isMobile = useIsMobile();
  const bodyEl = window.document.body;
  const handler = throttle(() => {
    isMobile.value = bodyEl.clientWidth <= 768;
    if (isMobile.value) {
      bodyEl.classList.add("is-mobile");
    } else {
      bodyEl.classList.remove("is-mobile");
    }
  }, 200);
  window.addEventListener("resize", handler);
  handler();
  // return {
  //   provide: {
  //     isMobile: /iPhone|iPad|iPod|Android/i.test(navigator.userAgent)
  //   }
  // };
});
