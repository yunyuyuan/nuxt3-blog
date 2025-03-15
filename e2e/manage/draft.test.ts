import { describe, expect, it } from "vitest";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

describe("Draft Operations", async () => {
  await setupTestEnvironment();

  it("Saving draft works", async () => {
    const { itemPage } = await createItemPage("/manage/articles/1111");

    const uploadBtn = await itemPage.getByTestId("item-upload-btn");
    expect(await uploadBtn.isDisabled()).toBe(true);

    await itemPage.fillItemDetails("draft title", "drafttag", "draft content");

    await itemPage.saveDraft();

    await itemPage.verifyDraftExists();
  });

  it("Applying draft works", async () => {
    const { itemPage } = await createItemPage("/manage/articles/1111");

    await itemPage.fillItemDetails("draft title", "drafttag", "draft content");

    await itemPage.saveDraft();

    await itemPage.verifyDraftExists();

    await itemPage.applyDraft();

    expect(await itemPage.getInputText("item-title-input")).toBe("draft title");
    expect(await itemPage.getInputText("item-tags-input")).toBe("drafttag");

    await itemPage.verifyEditorContent("draft content");
  });

  it("Deleting draft works", async () => {
    const { itemPage } = await createItemPage("/manage/articles/1111");

    await itemPage.saveDraft();

    await itemPage.verifyDraftExists();

    await itemPage.deleteDraft();

    await itemPage.verifyDraftDeleted();
  });

  it("Draft persists between page reloads", async () => {
    const { page, itemPage } = await createItemPage("/manage/articles/1111");

    await itemPage.fillItemDetails("persistent draft", "persisttag", "persistent content");
    await itemPage.saveDraft();
    await itemPage.verifyDraftExists();

    await page.reload();

    await itemPage.verifyDraftExists();

    await itemPage.applyDraft();

    expect(await itemPage.getInputText("item-title-input")).toBe("persistent draft");
    expect(await itemPage.getInputText("item-tags-input")).toBe("persisttag");
    await itemPage.waitForTimeout(1500);
    await itemPage.verifyEditorContent("persistent content");
  });
});
