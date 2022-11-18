import throttle from "lodash/throttle.js";
import { inBrowser } from "./constants";

let scrollEvent = null;
const eventName = "scroll-event";

export function initScrollTrigger () {
  if (inBrowser) {
    scrollEvent = new CustomEvent(eventName);
    window.addEventListener(
      "scroll",
      throttle(() => {
        window.dispatchEvent(scrollEvent);
      }, 200)
    );
  }
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
