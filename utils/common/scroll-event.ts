import throttle from "lodash/throttle.js";

let scrollEvent: Event;
const eventName = "scroll-event";

export function initScrollTrigger () {
  scrollEvent = new CustomEvent(eventName);
  window.addEventListener(
    "scroll",
    throttle(() => {
      window.dispatchEvent(scrollEvent);
    }, 200)
  );
}

export function addScrollListener (callback: () => void) {
  if (scrollEvent) {
    window.addEventListener(eventName, callback);
  }
}

export function rmScrollListener (callback: () => void) {
  if (scrollEvent) {
    window.removeEventListener(eventName, callback);
  }
}
