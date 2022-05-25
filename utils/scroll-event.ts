import throttle from "lodash/throttle.js";
import { inBrowser } from "./constants";

let scrollEvent = null;

export function initScrollTrigger () {
  if (inBrowser) {
    scrollEvent = new CustomEvent("scroll-event");
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
    window.addEventListener("scroll-event", callback);
  }
}

export function rmScrollListener (callback: () => void) {
  if (scrollEvent) {
    window.removeEventListener("scroll-event", callback);
  }
}
