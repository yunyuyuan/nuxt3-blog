import { describe, it } from "vitest";
import { ARTICLES, ARTICLE_COUNT, articlePath } from "./fixtures";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

/**
 * Converting an article between its three encryption modes
 * (plain ⇄ block-encrypted ⇄ fully-encrypted), covering every direction.
 */
describe("Item Converting", async () => {
  await setupTestEnvironment();

  it("plain → block-encrypted", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.plain.id));

    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.fillItemDetails("new title", "newtag", "[encrypt]\nnew content\n[/encrypt]");
    await itemPage.enterPassword();
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: false, title: "new title", tags: ["newtag"] },
      blockCount: 2,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ excludes: "new content" });
  });

  it("plain → fully-encrypted", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.plain.id));

    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.setEncrypted(true);
    await itemPage.fillItemDetails("new title", undefined, "new content");
    await itemPage.enterPassword();
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      notFind: i => i.title === "new title", // title is now ciphertext
      blockCount: 1,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ excludes: "new content" });
  });

  it("block-encrypted → plain", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.blockEncrypted.id));

    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.enterPassword();
    await itemPage.fillItemDetails("new title", "newtag", "new content");
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: false, title: "new title", tags: ["newtag"] },
      blockCount: 0,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ contains: "new content" });
  });

  it("block-encrypted → fully-encrypted", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.blockEncrypted.id));

    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.enterPassword();
    await itemPage.fillItemDetails("new title", undefined, "new content");
    await itemPage.setEncrypted(true);
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      notFind: i => i.title === "new title",
      blockCount: 0,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ excludes: "new content" });
  });

  it("fully-encrypted → plain", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.fullEncrypted.id));

    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.enterPassword();
    await itemPage.setEncrypted(false);
    await itemPage.fillItemDetails("new title", "newtag", "new content");
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: false, title: "new title", tags: ["newtag"] },
      blockCount: 1,
      hasEncryptedTitle: false // the only encrypted-title article is now plain
    });
    itemPage.expectCommittedContent({ contains: "new content" });
  });

  it("fully-encrypted → block-encrypted", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.fullEncrypted.id));

    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.enterPassword();
    await itemPage.setEncrypted(false);
    await itemPage.fillItemDetails("new title", "newtag", "[encrypt]\nnew content\n[/encrypt]");
    await itemPage.uploadItem();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: false, title: "new title", tags: ["newtag"] },
      blockCount: 2,
      hasEncryptedTitle: false
    });
    itemPage.expectCommittedContent({ excludes: "new content" });
  });
});
