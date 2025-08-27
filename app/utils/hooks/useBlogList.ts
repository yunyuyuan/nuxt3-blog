import { encryptDecryptItem } from "../common/process-encrypt-decrypt";
import type { CommonItem, HeaderTabUrl } from "../common/types";
import { fetchList } from "../nuxt/fetch";
import { deepClone } from "../nuxt/utils";

export const useBlogList = async <T extends CommonItem>(url: HeaderTabUrl, decryptId?: string) => {
  const encryptor = useEncryptor();

  const originList = await fetchList<T>(url);

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
