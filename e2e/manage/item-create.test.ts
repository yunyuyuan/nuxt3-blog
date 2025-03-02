import { describe, expect, it } from "vitest";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

describe("Item Creation", async () => {
  await setupTestEnvironment();

  it("Creating works", async () => {
    const { itemPage } = await createItemPage("/manage/articles/new");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);
    
    await itemPage.fillItemDetails("new title", "newtag", "new content");

    await itemPage.uploadItem();
      
    await itemPage.verifyItemListInResponse({
      expectedLength: 4,
      shouldFindItem: { encrypt: false, title: "new title", tags: ["newtag"] },
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse("new content");
  });

  it("Creating item with encryptedBlock works", async () => {
    const { itemPage } = await createItemPage("/manage/articles/new");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);
    
    await itemPage.fillItemDetails("new title", "newtag", "[encrypt]\nnew content\n[/encrypt]");
    
    await itemPage.enterPassword();

    await itemPage.uploadItem();
      
    await itemPage.verifyItemListInResponse({
      expectedLength: 4,
      shouldFindItem: { encrypt: false, title: "new title", tags: ["newtag"] },
      encryptBlocksItemsCount: 2,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse(undefined, "new content");
  });

  it("Creating encrypted item works", async () => {
    const { itemPage } = await createItemPage("/manage/articles/new");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);
    
    await itemPage.toggleEncrypted();
    await itemPage.fillItemDetails("new title", undefined, "new content");

    await itemPage.enterPassword();

    await itemPage.uploadItem();
      
    await itemPage.verifyItemListInResponse({
      expectedLength: 4,
      shouldFindItem: { encrypt: true, tags: [] },
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse(undefined, "new content");
  });
});