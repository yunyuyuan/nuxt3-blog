import { describe, expect, it } from "vitest";
import { ARTICLES, articlePath } from "./fixtures";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

const plainPath = articlePath(ARTICLES.plain.id);

describe("Item Validation & Field Gating", async () => {
  await setupTestEnvironment();

  it("blocks the commit when the title is cleared", async () => {
    const { itemPage } = await createItemPage(plainPath);

    await itemPage.setTitle("");
    // The change enables the button, but validation must still block the commit.
    await itemPage.expectDisabled("item-upload-btn", false);

    await itemPage.uploadItem();
    itemPage.expectNoCommit();
  });

  it("blocks the commit when the custom slug is invalid", async () => {
    const { itemPage } = await createItemPage(plainPath);

    await itemPage.setCustomSlug("bad slug!");
    await itemPage.uploadItem();

    itemPage.expectNoCommit();
  });

  it("commits a valid custom slug", async () => {
    const { itemPage } = await createItemPage(plainPath);

    await itemPage.setCustomSlug("custom-slug_1");
    await itemPage.uploadItem();

    expect(itemPage.findCommitted(i => i.id === ARTICLES.plain.id)?.customSlug).toBe("custom-slug_1");
  });

  it("persists the show-comments toggle", async () => {
    const { itemPage } = await createItemPage(plainPath);

    await itemPage.setShowComments(false);
    await itemPage.uploadItem();

    expect(itemPage.findCommitted(i => i.id === ARTICLES.plain.id)?.showComments).toBe(false);
  });

  it("deduplicates and trims tags", async () => {
    const { itemPage } = await createItemPage(plainPath);

    await itemPage.setTags("a, a , b , b");
    await itemPage.uploadItem();

    expect(itemPage.findCommitted(i => i.id === ARTICLES.plain.id)?.tags).toEqual(["a", "b"]);
  });

  it("locks the editor for a fully encrypted item until the password is entered", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.fullEncrypted.id));

    await itemPage.expectDisabled("item-title-input");
    await itemPage.expectDisabled("item-encrypt-checkbox");
    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.enterPassword();

    await itemPage.expectDisabled("item-title-input", false);
    await itemPage.expectDisabled("item-encrypt-checkbox", false);
  });

  it("locks the editor for a block-encrypted item until the password is entered", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.blockEncrypted.id));

    await itemPage.expectDisabled("item-title-input");
    await itemPage.expectDisabled("item-upload-btn");

    await itemPage.enterPassword();

    await itemPage.expectDisabled("item-title-input", false);
  });
});
