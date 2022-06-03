import { parseMarkdown, afterInsertHtml } from "../markdown";
import { processEncryptDescrypt } from "../process-encrypt-descrypt";
import { CommonItem } from "../types";
import { createNewItem, registerCancelWatchEncryptor, assignItem } from "../utils";
import { formatTime } from "../_dayjs";
import { TargetTab } from "~/plugins/target-tab";

/**
 * 详情页面通用功能
 */
export default function useContentPage<T extends CommonItem> () {
  const route = useRoute();
  const encryptor = useEncryptor();
  const markdownRef = ref<HTMLElement>();

  const id = route.params.id as string;

  const { targetTab, pending: listPending, list }: TargetTab = useNuxtApp().$targetTab.value;

  const item = reactive(createNewItem(targetTab.url)) as T;

  // cancelWatchPasswd
  const cancelFnList = registerCancelWatchEncryptor();

  watch(listPending, async (pend) => {
    if (!pend) {
      assignItem(item, list.value.find(item => item.id === Number(id)));
      if (item.encrypt) {
        cancelFnList.push(await encryptor.decryptOrWatchToDecrypt(async (decrypt) => {
          await processEncryptDescrypt(item, decrypt, targetTab.url);
        }));
      }
    }
  }, { immediate: true });

  // 所有页面都有markdown
  const mdContent = ref<string>("");
  const htmlContent = ref<string>("");
  const { pending, data: content } = useFetch(`/rebuild${targetTab.url}/${id}.md?s=${item.modifyTime}`);

  watch(pending, async (pend) => {
    if (!pend) {
      mdContent.value = content.value as string;
      // 取到结果后，处理解密
      if (item.encrypt) {
        cancelFnList.push(await encryptor.decryptOrWatchToDecrypt(
          async (decrypt) => {
            htmlContent.value = await parseMarkdown(await decrypt(mdContent.value));
          },
          () => {
            htmlContent.value = mdContent.value;
          }
        ));
      } else {
        htmlContent.value = await parseMarkdown(mdContent.value);
      }
    }
  }, { immediate: true });

  let destroyFns: ReturnType<typeof afterInsertHtml> = [];
  const htmlInserted = ref<boolean>(false);
  // 监听htmlContent变化，处理afterInsertHTML
  if (!pending.value) {
    onMounted(() => {
      // 双重nextTick，因为要等待v-show判断？
      nextTick(() => {
        destroyFns = afterInsertHtml(markdownRef.value, false, htmlInserted);
      });
    });
  } else {
    onMounted(() => {
      watch(htmlContent, () => {
        destroyFns = afterInsertHtml(markdownRef.value, false, htmlInserted);
      });
    });
  }

  onBeforeUnmount(() => {
    destroyFns.forEach(fn => fn());
  });

  // 所有页面都有发布时间与更新时间
  const publishTime = computed(() => formatTime(item.time));
  const modifyTime = computed(() => formatTime(item.modifyTime));

  return {
    item,
    tabUrl: targetTab.url,
    htmlContent,
    publishTime,
    modifyTime,
    markdownRef,
    mdPending: computed(() => !htmlContent.value),
    htmlInserted,
    listPending
  };
}
