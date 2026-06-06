import { describe, expect, it } from "vitest";
import { ARTICLES, articlePath } from "./fixtures";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

describe("Item Deletion", async () => {
  await setupTestEnvironment();

  it("deletes a plain item", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.plain.id));

    await itemPage.expectDisabled("item-delete-btn", false);
    await itemPage.deleteItem();

    itemPage.expectCommittedList({
      notFind: i => i.id === ARTICLES.plain.id,
      blockCount: 1,
      hasEncryptedTitle: true
    });
    itemPage.expectDeletedFile(`${ARTICLES.plain.id}.md`);
  });

  it("deletes a plain item even after the password is entered", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.plain.id));

    await itemPage.expectDisabled("item-delete-btn", false);
    await itemPage.enterPassword();
    await itemPage.deleteItem();

    itemPage.expectCommittedList({
      notFind: i => i.id === ARTICLES.plain.id,
      blockCount: 1,
      hasEncryptedTitle: true
    });
    itemPage.expectDeletedFile(`${ARTICLES.plain.id}.md`);
  });

  it("deletes a block-encrypted item, revealing blocks once decrypted", async () => {
    const { itemPage } = await createItemPage(articlePath(ARTICLES.blockEncrypted.id));

    await itemPage.expectDisabled("item-delete-btn", false);

    // Before decrypting only the two plain "test" lines are visible.
    await itemPage.waitForTimeout(1500);
    const renderedMarkdown = itemPage.getByTestId("rendered-markdown");
    expect((await renderedMarkdown.innerText()).match(/test/g)).lengthOf(2);

    // After decrypting, the two encrypted blocks resolve to "test" as well.
    await itemPage.enterPassword();
    expect((await renderedMarkdown.innerText()).match(/test/g)).lengthOf(4);

    await itemPage.deleteItem();

    itemPage.expectCommittedList({
      notFind: i => i.id === ARTICLES.blockEncrypted.id,
      hasEncryptedTitle: true
    });
    itemPage.expectDeletedFile(`${ARTICLES.blockEncrypted.id}.md`);
  });
});
