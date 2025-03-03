import { afterInsertHtml, parseMarkdown } from "../nuxt/markdown";

type useMarkdownParserProps = {
  mdValueRef: Ref<string>;
  fromEdit?: boolean;
  onAfterInsertHtml?: CallableFunction;
  destroyFns?: CallableFunction[];
};

export const useMarkdownParser = async ({ mdValueRef, fromEdit, onAfterInsertHtml, destroyFns }: useMarkdownParserProps) => {
  const markdownRef = ref<HTMLElement>();

  const htmlContent = ref("");
  const menuItems = ref<Awaited<ReturnType<typeof parseMarkdown>>["menu"]>([]);

  const parse = async (md: string) => {
    const result = await parseMarkdown(md);
    htmlContent.value = result.md;
    menuItems.value = result.menu;
  };

  watch(mdValueRef, async (md) => {
    parse(md);
  });

  await parse(mdValueRef.value);

  watch(htmlContent, () => {
    setTimeout(async () => {
      if (markdownRef.value) {
        const fns = await afterInsertHtml(markdownRef.value, fromEdit);
        onAfterInsertHtml?.();
        destroyFns?.splice(0, destroyFns.length, ...fns);
      }
    });
  }, { immediate: true });

  return {
    markdownRef,
    htmlContent,
    menuItems
  };
};
