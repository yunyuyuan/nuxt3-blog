import { afterInsertHtml, parseMarkdown } from "../nuxt/markdown";
import { useUnmount } from "./useUnmount";

type useMarkdownParserProps = {
  mdValueRef: Ref<string>,
  fromEdit?: boolean,
  onAfterInsertHtml?: CallableFunction,
}

export const useMarkdownParser = ({ mdValueRef, fromEdit, onAfterInsertHtml }: useMarkdownParserProps) => {
  const markdownRef = ref<HTMLElement>();

  const htmlContent = ref("");
  const menuItems = ref<Awaited<ReturnType<typeof parseMarkdown>>["menu"]>([]);
  
  const destroyFns = useUnmount();

  watch(mdValueRef, async (md) => {
    const result = await parseMarkdown(md);
    htmlContent.value = result.md;
    menuItems.value = result.menu;
  }, { immediate: true });
  
  watch(htmlContent, () => {
    setTimeout(async () => {
      if (markdownRef.value) {
        const fns = await afterInsertHtml(markdownRef.value, fromEdit);
        onAfterInsertHtml?.();
        destroyFns.splice(0, destroyFns.length, ...fns);
      }
    });
  }, { immediate: true });

  return {
    markdownRef,
    htmlContent,
    menuItems
  };
};