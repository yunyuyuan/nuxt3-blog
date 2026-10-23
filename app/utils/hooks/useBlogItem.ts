import { decryptEncryptBlocks, hideEncryptBlocks, showEncryptBlocksPlaceholder } from "../common/process-encrypt-decrypt";
import type { CommonItem, HeaderTabUrl } from "../common/types";
import { fetchMd } from "../nuxt/fetch";
import { translate } from "../nuxt/i18n";
import { useBlogList } from "./useBlogList";

export const useBlogItem = async <T extends CommonItem>(id: string, url: HeaderTabUrl, showNotFound = true) => {
  const githubToken = useGithubToken();
  const encryptor = useEncryptor();
  const { originList, decryptedList } = await useBlogList<T>(url, id);

  const originItem = originList.find(i => i.customSlug === id || i.id === Number(id));
  const decryptedItem = computed(() => decryptedList.value?.find(i => i.customSlug === id || i.id === Number(id))) as Readonly<Ref<T>>;
  let originMd = "";
  const decryptedMd = ref("");
  const successDecrypt = ref(false);

  if (originItem) {
    const item = originItem;
    originMd = await fetchMd(url, String(originItem.id));
    if (item.encrypt) {
      decryptedMd.value = originMd;
      await encryptor.decryptOrWatchToDecrypt(
        async (decrypt) => {
          decryptedMd.value = await decrypt(originMd);
          successDecrypt.value = true;
        }
      );
    } else if (item.encryptBlocks?.length) {
      // encryptBlocks 只表示“有加密块”，位置从正文的 [encrypt] 标记解析
      watch(githubToken, async (logined) => {
        // 已登录：加密块显示为占位；未登录：直接隐藏
        decryptedMd.value = logined
          ? showEncryptBlocksPlaceholder(originMd, translate("encrypted-content"))
          : hideEncryptBlocks(originMd);

        await encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
          decryptedMd.value = await decryptEncryptBlocks(originMd, decrypt);
          successDecrypt.value = true;
        });
      }, { immediate: true });
    } else {
      decryptedMd.value = originMd;
      successDecrypt.value = true;
    }
  } else if (showNotFound) {
    showError({
      status: 404,
      statusText: `${url}/${id} not found`,
      message: "wtf bro"
    });
  }

  return {
    originList,
    decryptedList,

    successDecrypt,
    originItem,
    decryptedItem,
    originMd,
    decryptedMd
  };
};
