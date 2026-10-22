import { encryptDecryptItem } from "../common/process-encrypt-decrypt";
import type { CommonItem, HeaderTabUrl } from "../common/types";
import { fetchList } from "../nuxt/fetch";
import { deepClone } from "../nuxt/utils";

type Encryptor = ReturnType<typeof useEncryptor>;

/**
 * 复制一份列表，有密码时解密其中的加密条目（指定 decryptId 时只解密这一条）。
 * encryptor 由调用方在第一个 await 之前取得，因为 await 之后不能再调用 composable。
 */
export const decryptListWith = async <T extends CommonItem>(encryptor: Encryptor, originList: T[], url: HeaderTabUrl, decryptId?: string) => {
  const decryptedList = ref(deepClone(originList)) as Ref<T[]>;

  await encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
    for (const item of decryptedList.value) {
      if (item.encrypt && (!decryptId || item.customSlug === decryptId || item.id === Number(decryptId))) {
        await encryptDecryptItem(item, decrypt, url);
      }
    }
  });

  return {
    originList,
    decryptedList
  };
};

export const useBlogList = async <T extends CommonItem>(url: HeaderTabUrl, decryptId?: string) => {
  const encryptor = useEncryptor();

  const originList = await fetchList<T>(url);

  return await decryptListWith(encryptor, originList, url, decryptId);
};
