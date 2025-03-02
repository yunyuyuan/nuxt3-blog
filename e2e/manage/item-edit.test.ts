import { describe, expect, it } from "vitest";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

describe("Item Editing", async () => {
  await setupTestEnvironment();

  it("Editing works", async () => {
    const { itemPage } = await createItemPage("/manage/articles/1111");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);
    
    await itemPage.fillItemDetails("new title", "newtag", "new content");

    await itemPage.uploadItem();
      
    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: false, title: "new title", tags: ["newtag"] },
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse("new content");
  });

  it("Editing item with encryptedBlock works", async () => {
    const { itemPage } = await createItemPage("/manage/articles/2222");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);

    expect(await itemPage.isElementDisabled("item-title-input")).toBe(true);

    await itemPage.enterPassword();
    
    await itemPage.fillItemDetails("new title", "newtag", "[encrypt]\nnew content\n[/encrypt]");

    await itemPage.uploadItem();
      
    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: false, title: "new title", tags: ["newtag"] },
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse(undefined, "new content");
  });

  it("Editing encrypted item works", async () => {
    const { itemPage } = await createItemPage("/manage/articles/3333");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);
    
    expect(await itemPage.isElementDisabled("item-title-input")).toBe(true);

    await itemPage.enterPassword();
    
    await itemPage.fillItemDetails("new title", undefined, "new content");

    await itemPage.uploadItem();
      
    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: true, tags: [] },
      encryptBlocksItemsCount: 1
    });

    await itemPage.verifyItemContentInResponse(undefined, "new content");
  });
});