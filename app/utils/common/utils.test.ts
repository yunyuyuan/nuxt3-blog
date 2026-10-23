import { describe, expect, it } from "vitest";
import { markdownExcerpt } from "./utils";

describe("markdownExcerpt", () => {
  it("keeps plain text and strips markdown syntax", () => {
    const md = "# Title\n\nSome **bold** and `code` text.\n\n- item one\n> quote";
    expect(markdownExcerpt(md)).toBe("Title Some bold and code text. item one quote");
  });

  it("drops encrypted blocks, raw html, code blocks and media embeds", () => {
    const md = [
      "visible start",
      "[encrypt]\nsecret\n[/encrypt]",
      "[html]<div>raw</div>[/html]",
      "```js\nconst a = 1;\n```",
      "[bili][name](https://example.com)[/bili]",
      "![alt](https://example.com/a.png)",
      "visible end"
    ].join("\n");
    expect(markdownExcerpt(md)).toBe("visible start visible end");
  });

  it("keeps the text of links and custom inline styles", () => {
    const md = "see [docs](https://a.com), #[blank](https://b.com), -(red: colored)- and _(under)_";
    expect(markdownExcerpt(md)).toBe("see docs, blank, colored and under");
  });

  it("drops block markers and backslash escapes", () => {
    const md = [
      "::: tip Hello![sticker](cube/13)",
      "Welcome!",
      ":::",
      "-----",
      "--legend--",
      "inside",
      "-- --",
      "| a | b |",
      "| --- | :-: |",
      "#[https:\\/\\/a.com/](https://a.com/)"
    ].join("\n");
    expect(markdownExcerpt(md)).toBe("Hello Welcome! legend inside a b https://a.com/");
  });

  it("truncates long text", () => {
    const excerpt = markdownExcerpt("a".repeat(200), 10);
    expect(excerpt).toBe(`${"a".repeat(10)}…`);
  });
});
