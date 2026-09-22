import { parseMarkdown } from "../common/markdown";
import { afterInsertHtml } from "../nuxt/markdown";

type useMarkdownParserProps = {
  mdValueRef: Ref<string>;
  fromEdit?: boolean;
  onAfterInsertHtml?: CallableFunction;
  destroyFns?: CallableFunction[];
};

const waitUntilConnected = (element: HTMLElement, signal: AbortSignal) => {
  if (signal.aborted) return Promise.resolve(false);
  if (element.isConnected) return Promise.resolve(true);

  return new Promise<boolean>((resolve) => {
    const observer = new MutationObserver(() => {
      if (element.isConnected) finish(true);
    });
    const finish = (connected: boolean) => {
      observer.disconnect();
      signal.removeEventListener("abort", onAbort);
      resolve(connected);
    };
    const onAbort = () => finish(false);

    signal.addEventListener("abort", onAbort, { once: true });
    observer.observe(document, { childList: true, subtree: true });

    // Close the gap between the initial check and observer registration.
    if (element.isConnected) finish(true);
  });
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

  let disposed = false;
  let enhanceVersion = 0;
  let enhanceController: AbortController | undefined;
  const enhancementCleanupFns: CallableFunction[] = [];

  const cleanupEnhancements = () => {
    enhanceController?.abort();
    enhanceController = undefined;
    enhancementCleanupFns.splice(0).forEach(fn => fn());
  };

  const enhanceMarkdown = async (element: HTMLElement) => {
    const version = ++enhanceVersion;
    cleanupEnhancements();

    const controller = new AbortController();
    enhanceController = controller;

    // A template ref can become available before a transitioning page is attached
    // to document. Mermaid performs document-level lookups while rendering, so only
    // start post-processing after Vue has flushed the DOM and the element is connected.
    await nextTick();
    if (disposed || controller.signal.aborted || element !== markdownRef.value) {
      return;
    }
    if (!await waitUntilConnected(element, controller.signal)) {
      return;
    }

    try {
      const fns = await afterInsertHtml(element, fromEdit, controller.signal);
      if (disposed || controller.signal.aborted || version !== enhanceVersion || element !== markdownRef.value || !element.isConnected) {
        fns.forEach(fn => fn());
        return;
      }

      enhancementCleanupFns.push(...fns);
      onAfterInsertHtml?.();
    } catch (error) {
      if (!disposed && !controller.signal.aborted) {
        console.error("Failed to enhance markdown", error);
      }
    }
  };

  const stopEnhancementWatch = watch(
    [htmlContent, markdownRef],
    ([, element]) => {
      if (element) {
        void enhanceMarkdown(element);
      }
    },
    { immediate: true, flush: "post" }
  );

  const destroyEnhancements = () => {
    disposed = true;
    enhanceVersion++;
    stopEnhancementWatch();
    cleanupEnhancements();
  };

  if (destroyFns) {
    destroyFns.push(destroyEnhancements);
  } else if (getCurrentScope()) {
    onScopeDispose(destroyEnhancements);
  }

  return {
    markdownRef,
    htmlContent,
    menuItems
  };
};
