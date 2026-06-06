import { describe, it } from "vitest";
import { ARTICLE_COUNT, NEW_ID, articlePath } from "./fixtures";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

const newArticlePath = articlePath(NEW_ID);

describe("Item Creation", async () => {
  await setupTestEnvironment();

  it("creates a plain item", async () => {
    const { itemPage } = await createItemPage(newArticlePath);

    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.fillItemDetails("new title", "newtag", "new content");
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT + 1,
      find: { encrypt: false, title: "new title", tags: ["newtag"] },
      blockCount: 1, // the seeded block-encrypted article is untouched
      hasEncryptedTitle: true // the seeded fully-encrypted article is untouched
    });
    itemPage.expectCommittedContent({ contains: "new content" });
  });

  it("creates an item with an encrypted block", async () => {
    const { itemPage } = await createItemPage(newArticlePath);

    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.fillItemDetails("new title", "newtag", "[encrypt]\nnew content\n[/encrypt]");
    await itemPage.enterPassword();
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT + 1,
      find: { encrypt: false, title: "new title", tags: ["newtag"] },
      blockCount: 2, // the new item + the seeded block-encrypted article
      hasEncryptedTitle: true
    });
    // The block body must be encrypted, never committed as plaintext.
    itemPage.expectCommittedContent({ excludes: "new content" });
  });

  it("creates a fully encrypted item", async () => {
    const { itemPage } = await createItemPage(newArticlePath);

    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.setEncrypted(true);
    await itemPage.fillItemDetails("new title", undefined, "new content");
    await itemPage.enterPassword();
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT + 1,
      find: { encrypt: true, tags: [] }, // encrypting an article clears its tags
      blockCount: 1,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ excludes: "new content" });
  });
});
