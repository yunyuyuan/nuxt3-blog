import { describe, expect, it } from "vitest";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

describe("Item Deletion", async () => {
  await setupTestEnvironment();

  it("Deleting works", async () => {
    const { itemPage } = await createItemPage("/manage/articles/1111");

    const deleteBtn = await itemPage.getByTestId("item-delete-btn");
    expect(await deleteBtn.isDisabled()).toBe(false);

    await itemPage.deleteItem();

    await itemPage.verifyItemListInResponse({
      shouldNotFindItem: i => i.id === 1111,
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyDeletionPathInResponse("1111.md");
  });

  it("Deleting works after entering password", async () => {
    const { itemPage } = await createItemPage("/manage/articles/1111");

    const deleteBtn = await itemPage.getByTestId("item-delete-btn");
    expect(await deleteBtn.isDisabled()).toBe(false);

    await itemPage.enterPassword();

    await itemPage.deleteItem();

    await itemPage.verifyItemListInResponse({
      shouldNotFindItem: i => i.id === 1111,
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyDeletionPathInResponse("1111.md");
  });

  it("Deleting item with encryptedBlock works after entering password", async () => {
    const { itemPage } = await createItemPage("/manage/articles/2222");

    const deleteBtn = await itemPage.getByTestId("item-delete-btn");
    expect(await deleteBtn.isDisabled()).toBe(false);

    await itemPage.waitForTimeout(1500);
    const renderedMarkdown = await itemPage.getByTestId("rendered-markdown");
    expect((await renderedMarkdown.innerText()).match(/test/g)).lengthOf(2);

    await itemPage.enterPassword();
    expect((await renderedMarkdown.innerText()).match(/test/g)).lengthOf(4);

    await itemPage.deleteItem();

    await itemPage.verifyItemListInResponse({
      shouldNotFindItem: i => i.id === 2222,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyDeletionPathInResponse("2222.md");
  });
});
