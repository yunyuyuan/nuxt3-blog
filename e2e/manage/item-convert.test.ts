import { describe, expect, it } from "vitest";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

describe("Item Converting", async () => {
  await setupTestEnvironment();

  it("No-Encrypt to Block-Encrypt", async () => {
    const { itemPage } = await createItemPage("/manage/articles/1111");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);

    await itemPage.fillItemDetails("new title", "newtag", "[encrypt]\nnew content\n[/encrypt]");

    await itemPage.enterPassword();

    await itemPage.uploadItem();

    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: false, title: "new title", tags: ["newtag"] },
      encryptBlocksItemsCount: 2,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse(undefined, "new content");
  });

  it("No-Encrypt to Encrypted", async () => {
    const { itemPage } = await createItemPage("/manage/articles/1111");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);

    await itemPage.toggleEncrypted();

    await itemPage.fillItemDetails("new title", undefined, "new content");

    await itemPage.enterPassword();

    await itemPage.uploadItem();

    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldNotFindItem: i => i.title === "new title",
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse(undefined, "new content");
  });

  it("Block-Encrypt to No-Encrypt", async () => {
    const { itemPage } = await createItemPage("/manage/articles/2222");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);

    await itemPage.enterPassword();

    await itemPage.fillItemDetails("new title", "newtag", "new content");

    await itemPage.uploadItem();

    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: false, title: "new title", tags: ["newtag"] },
      encryptBlocksItemsCount: 0,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse("new content");
  });

  it("Block-Encrypt to Encrypt", async () => {
    const { itemPage } = await createItemPage("/manage/articles/2222");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);

    await itemPage.enterPassword();

    await itemPage.fillItemDetails("new title", undefined, "new content");

    await itemPage.toggleEncrypted();

    await itemPage.uploadItem();

    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldNotFindItem: i => i.title === "new title",
      encryptBlocksItemsCount: 0,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse(undefined, "new content");
  });

  it("Encrypt to No-Encrypt", async () => {
    const { itemPage } = await createItemPage("/manage/articles/3333");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);

    await itemPage.enterPassword();

    await itemPage.toggleEncrypted();

    await itemPage.fillItemDetails("new title", "newtag", "new content");

    await itemPage.uploadItem();

    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: false, title: "new title", tags: ["newtag"] },
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: false
    });

    await itemPage.verifyItemContentInResponse("new content");
  });

  it("Encrypt to Block-Encrypt", async () => {
    const { itemPage } = await createItemPage("/manage/articles/3333");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);

    await itemPage.enterPassword();

    await itemPage.toggleEncrypted();

    await itemPage.fillItemDetails("new title", "newtag", "[encrypt]\nnew content\n[/encrypt]");

    await itemPage.uploadItem();

    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: false, title: "new title", tags: ["newtag"] },
      encryptBlocksItemsCount: 2,
      shouldContainEncryptedTitle: false
    });

    await itemPage.verifyItemContentInResponse(undefined, "new content");
  });
});
