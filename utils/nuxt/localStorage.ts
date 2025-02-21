/**
 * localStorage 操作
 */
export function getLocalStorage<T extends string> (key: string): T | null {
  return window?.localStorage?.getItem(key) as T;
}

export function setLocalStorage (key: string, value: string) {
  window?.localStorage?.setItem(key, value);
}

export function rmLocalStorage (key: string) {
  window?.localStorage?.removeItem(key);
}