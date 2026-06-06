import { describe, it } from "vitest";
import { ARTICLES, ARTICLE_COUNT, articlePath } from "./fixtures";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

describe("Item Editing", async () => {
  await setupTestEnvironment();

  it("edits a plain item", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.plain.id));

    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.fillItemDetails("new title", "newtag", "new content");
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: false, title: "new title", tags: ["newtag"] },
      blockCount: 1,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ contains: "new content" });
  });

  it("edits a block-encrypted item after entering the password", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.blockEncrypted.id));

    await itemPage.expectDisabled("item-upload-btn");
    // Fields stay locked until the blocks are decrypted.
    await itemPage.expectDisabled("item-title-input");

    await itemPage.enterPassword();
    await itemPage.fillItemDetails("new title", "newtag", "[encrypt]\nnew content\n[/encrypt]");
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: false, title: "new title", tags: ["newtag"] },
      blockCount: 1,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ excludes: "new content" });
  });

  it("edits a fully encrypted item after entering the password", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.fullEncrypted.id));

    await itemPage.expectDisabled("item-upload-btn");
    await itemPage.expectDisabled("item-title-input");

    await itemPage.enterPassword();
    await itemPage.fillItemDetails("new title", undefined, "new content");
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: true, tags: [] },
      blockCount: 1
    });
    itemPage.expectCommittedContent({ excludes: "new content" });
  });
});
