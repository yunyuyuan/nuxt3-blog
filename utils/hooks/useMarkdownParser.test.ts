import { describe, expect, it } from "vitest";
import { useMarkdownParser } from "./useMarkdownParser";

const timeout = () => new Promise(resolve => setTimeout(resolve, 16));

describe("useMarkdownParser", () => {
  it("should works", async () => {
    const mdValueRef = ref("# Hello World\n# test ![sticker](aru/1)");
    const { htmlContent, menuItems } = useMarkdownParser({ mdValueRef });
    await timeout();
    expect(htmlContent.value).toContain(">Hello World</");
    expect(menuItems.value).lengthOf(2);
  });
});