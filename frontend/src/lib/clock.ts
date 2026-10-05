import { useSyncExternalStore } from "react";

// One shared 1-second clock for every live countdown on the page
let now = Date.now();
const subscribers = new Set<() => void>();
let timer: number | undefined;

function subscribe(cb: () => void) {
  subscribers.add(cb);
  if (subscribers.size === 1) {
    now = Date.now();
    timer = window.setInterval(() => {
      now = Date.now();
      subscribers.forEach((s) => s());
    }, 1000);
  }
  return () => {
    subscribers.delete(cb);
    if (subscribers.size === 0) window.clearInterval(timer);
  };
}

export function useNow() {
  return useSyncExternalStore(subscribe, () => now);
}
