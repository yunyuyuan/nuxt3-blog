import type { CommonItem } from "~/utils/common";
import { deepClone } from "../utils";

export const editItem = <T extends CommonItem>(originList: Readonly<T[]>, item: T) => {
  const cloneList = originList.map(item => deepClone(item));
  const foundIndex = originList.findIndex(i => i.id === item?.id);
  if (foundIndex < 0) {
    cloneList.splice(0, 0, item);
  } else {
    cloneList.splice(foundIndex, 1, item);
  }
  return cloneList;
};

export const deleteItem = <T extends CommonItem>(originList: Readonly<T[]>, item: T) => {
  return deepClone(originList).filter(i => i.id !== item.id);
};