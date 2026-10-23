import { withBase as ufoWithBase } from "ufo";

export function withBase(path: string): string {
  return ufoWithBase(path, __NB_BASE_URL__);
}
