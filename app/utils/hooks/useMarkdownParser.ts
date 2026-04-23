import { parseMarkdown } from "../common/markdown";
import { afterInsertHtml } from "../nuxt/markdown";

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

  let parseVersion = 0;
  const parse = async (md: string) => {
    const version = ++parseVersion;
    const result = await parseMarkdown(md, __NB_BASE_URL__);
    if (version === parseVersion) {
      htmlContent.value = result.md;
      menuItems.value = result.menu;
    }
  };

  watch(mdValueRef, async (md) => {
    await parse(md);
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
