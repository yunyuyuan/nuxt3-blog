import type { CommonItem, HeaderTabUrl } from "../common/types";
import { fetchMd } from "../nuxt/fetch";
import { translate } from "../nuxt/i18n";
import { useBlogList } from "./useBlogList";

export const useBlogItem = async <T extends CommonItem>(id: T["id"], url: HeaderTabUrl, showNotFound = true) => {
  const githubToken = useGithubToken();
  const encryptor = useEncryptor();
  const { originList, decryptedList } = await useBlogList<T>(url, id);

  const originItem = originList.find(i => i.id === Number(id));
  const decryptedItem = computed(() => decryptedList.value?.find(i => i.id === Number(id))) as Readonly<Ref<T>>;
  let originMd = "";
  const decryptedMd = ref("");
  const successDecrypt = ref(false);

  if (originItem) {
    const item = originItem;
    originMd = await fetchMd(url, String(id));
    if (item.encrypt) {
      decryptedMd.value = originMd;
      await encryptor.decryptOrWatchToDecrypt(
        async (decrypt) => {
          decryptedMd.value = await decrypt(originMd);
          successDecrypt.value = true;
        }
      );
    } else if (item.encryptBlocks) {
      watch(githubToken, async (logined) => {
        let newMarkdownContent = originMd;
        for (const block of item.encryptBlocks!) {
          const { start, end } = block;
          newMarkdownContent = logined
          // 如果已登录：给block显示为sticker表情
            ? newMarkdownContent.slice(0, start) + translate("encrypted-content") + "![sticker](aru/59)" + newMarkdownContent.slice(end)
          // 如果未登录：直接隐藏block
            : newMarkdownContent.slice(0, start - 10) + newMarkdownContent.slice(end + 11);
        }
        decryptedMd.value = newMarkdownContent;

        await encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
          let newMarkdownContent = originMd;
          for (const block of item.encryptBlocks!) {
            const { start, end } = block;
            newMarkdownContent = newMarkdownContent.slice(0, start) + await decrypt(newMarkdownContent.slice(start, end)) + newMarkdownContent.slice(end);
          }
          decryptedMd.value = newMarkdownContent;
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
