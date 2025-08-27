import { describe, expect, it } from "vitest";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

describe("Staging Functionality", async () => {
  await setupTestEnvironment();

  it("Can stage an item and load it back", async () => {
    const { itemPage } = await createItemPage("/manage/articles/0");

    // Fill in item details
    await itemPage.fillItemDetails("staged title", "stagedtag", "staged content");

    // Stage the item
    const stageBtn = await itemPage.getByTestId("item-stage-btn");
    await stageBtn.click();
    await itemPage.waitForTimeout();

    // Clear the form
    await itemPage.fillInput("item-title-input", "");
    await itemPage.fillInput("item-tags-input", "");
    await itemPage.clearAndTypeInMonacoEditor("");

    // Load staged item back
    const loadStagedBtn = await itemPage.getByTestId("load-staged-btn");
    await loadStagedBtn.click();
    await itemPage.waitForTimeout();

    // Verify content is loaded back
    const titleValue = await itemPage.getInputText("item-title-input");
    const tagsValue = await itemPage.getInputText("item-tags-input");

    expect(titleValue).toBe("staged title");
    expect(tagsValue).toBe("stagedtag");
  });

  it("Can delete staged item", async () => {
    const { itemPage } = await createItemPage("/manage/articles/0");

    // Fill in item details and stage
    await itemPage.fillItemDetails("to delete", "deletetag", "delete content");
    await itemPage.clickElement("item-stage-btn");

    // Delete staged item
    const deleteStagedBtn = await itemPage.getByTestId("delete-staged-btn");
    await deleteStagedBtn.click();
    await itemPage.waitForTimeout();

    // Verify load staged button is disabled or not visible
    const loadStagedBtn = await itemPage.getByTestId("load-staged-btn");
    const isDisabled = await loadStagedBtn.isDisabled();
    expect(isDisabled).toBe(true);
  });

  it("Shows staged items indicator in list page after staging", async () => {
    // Create an item with staging first
    const { itemPage, page } = await createItemPage("/manage/articles/1111");

    // Fill and stage the item
    await itemPage.fillItemDetails("list staged title", "listtag", "list staged content");
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    // Navigate to list page using the same page instance
    await page.goto("/manage/articles", { waitUntil: "hydration" });

    // Verify sidebar commit staged button is visible
    const commitStagedBtn = await itemPage.getByTestId("commit-staged-btn");
    const isVisible = await commitStagedBtn.isVisible();
    expect(isVisible).toBe(true);
  });

  it("Shows auto load staged modal when returning to edit page", async () => {
    // First stage an item
    const { itemPage, page } = await createItemPage("/manage/articles/1111");
    await itemPage.fillItemDetails("auto load title", "autoloadtag", "auto load content");
    await itemPage.clickElement("item-stage-btn");

    // Navigate away and return to the same edit page using same page instance
    await page.goto("/manage/articles");
    await itemPage.waitForTimeout(500);
    await page.goto("/manage/articles/1111", { waitUntil: "hydration" });
    await itemPage.waitForTimeout(500);

    // Check if the load staged modal appears automatically
    const loadStagedModal = await itemPage.getByTestId("load-staged-modal");
    const isModalVisible = await loadStagedModal.isVisible();
    expect(isModalVisible).toBe(true);
  });

  it("Can commit staged items after modification", async () => {
    const { itemPage, page } = await createItemPage("/manage/articles/1111");

    // Fill and stage the item
    await itemPage.fillItemDetails("commit test title", "committag", "commit test content");
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    // Navigate to list page
    await page.goto("/manage/articles", { waitUntil: "hydration" });

    // Click commit staged button to open modal
    const commitStagedBtn = await itemPage.getByTestId("commit-staged-btn");
    await commitStagedBtn.click();
    await itemPage.waitForTimeout();

    // Verify staged items modal is open
    const stagedItemsModal = await itemPage.getByTestId("staged-items-modal");
    const isModalVisible = await stagedItemsModal.isVisible();
    expect(isModalVisible).toBe(true);

    // Confirm commit (the modal should have confirm/ok functionality)
    // Based on CommonModal pattern, there should be a confirm action
    const commitStageOkBtn = await itemPage.getByTestId("staged-items-modal-ok");
    await commitStageOkBtn.click();
    await itemPage.waitForTimeout();

    // Verify the upload was successful by checking github requests
    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: false, title: "commit test title", tags: ["committag"] },
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse("commit test content");
  });

  it("Can stage and load encrypted item", async () => {
    const { itemPage } = await createItemPage("/manage/articles/0");

    // Toggle encrypted mode
    await itemPage.toggleEncrypted();

    // Fill in encrypted item details
    await itemPage.fillItemDetails("encrypted staged title", undefined, "encrypted staged content");

    // Enter password for encrypted item
    await itemPage.enterPassword();

    // Stage the encrypted item
    const stageBtn = await itemPage.getByTestId("item-stage-btn");
    await stageBtn.click();
    await itemPage.waitForTimeout();

    // Clear the form
    await itemPage.fillInput("item-title-input", "");
    await itemPage.clearAndTypeInMonacoEditor("");

    // Load staged encrypted item back
    const loadStagedBtn = await itemPage.getByTestId("load-staged-btn");
    await loadStagedBtn.click();
    await itemPage.waitForTimeout();

    // Verify encrypted content is loaded back
    const titleValue = await itemPage.getInputText("item-title-input");
    expect(titleValue).toBe("encrypted staged title");

    // Verify encrypted content is loaded back
    const contentValue = await itemPage.getMonacoEditorText();
    expect(contentValue).toContain("encryptedstagedcontent");

    // Verify encrypted mode is still toggled
    const encryptedToggle = await itemPage.getByTestId("item-encrypt-checkbox");
    const isChecked = await encryptedToggle.isChecked();
    expect(isChecked).toBe(true);
  });

  it("Can stage and load item with encrypted blocks", async () => {
    const { itemPage } = await createItemPage("/manage/articles/0");

    // Fill in item details with encrypted blocks
    await itemPage.fillItemDetails("block staged title", "blocktag", "hello\n[encrypt]\nblock staged content\n[/encrypt]\nworld");

    // Enter password for encrypted blocks
    await itemPage.enterPassword();

    // Stage the item with encrypted blocks
    const stageBtn = await itemPage.getByTestId("item-stage-btn");
    await stageBtn.click();
    await itemPage.waitForTimeout();

    // Clear the form
    await itemPage.fillInput("item-title-input", "");
    await itemPage.fillInput("item-tags-input", "");
    await itemPage.clearAndTypeInMonacoEditor("");

    // Load staged item back
    const loadStagedBtn = await itemPage.getByTestId("load-staged-btn");
    await loadStagedBtn.click();
    await itemPage.waitForTimeout();

    // Verify content is loaded back
    const titleValue = await itemPage.getInputText("item-title-input");
    const tagsValue = await itemPage.getInputText("item-tags-input");
    const contentValue = await itemPage.getMonacoEditorText();
    expect(titleValue).toBe("block staged title");
    expect(tagsValue).toBe("blocktag");
    expect(contentValue).toContain("blockstagedcontent");
  });

  it("Can stage encrypted item and commit it", async () => {
    const { itemPage, page } = await createItemPage("/manage/articles/0");

    // Toggle encrypted mode and fill details
    await itemPage.toggleEncrypted();
    await itemPage.fillItemDetails("staged encrypted title", undefined, "staged encrypted content");
    await itemPage.enterPassword();

    // Stage the encrypted item
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    // Navigate to list page
    await page.goto("/manage/articles", { waitUntil: "hydration" });

    // Commit staged items
    const commitStagedBtn = await itemPage.getByTestId("commit-staged-btn");
    await commitStagedBtn.click();
    await itemPage.waitForTimeout();

    const commitStageOkBtn = await itemPage.getByTestId("staged-items-modal-ok");
    await commitStageOkBtn.click();
    await itemPage.waitForTimeout();

    // Verify encrypted item was committed
    await itemPage.verifyItemListInResponse({
      expectedLength: 4,
      shouldFindItem: { encrypt: true, tags: [] },
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse(undefined, "staged encrypted content");
  });

  it("Can stage item with encrypted blocks and commit it", async () => {
    const { itemPage, page } = await createItemPage("/manage/articles/0");

    // Fill details with encrypted blocks
    await itemPage.fillItemDetails("staged block title", "blocktag", "[encrypt]\nstaged block content\n[/encrypt]");
    await itemPage.enterPassword();

    // Stage the item
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    // Navigate to list page
    await page.goto("/manage/articles", { waitUntil: "hydration" });

    // Commit staged items
    const commitStagedBtn = await itemPage.getByTestId("commit-staged-btn");
    await commitStagedBtn.click();
    await itemPage.waitForTimeout();

    const commitStageOkBtn = await itemPage.getByTestId("staged-items-modal-ok");
    await commitStageOkBtn.click();
    await itemPage.waitForTimeout();

    // Verify item with encrypted blocks was committed
    await itemPage.verifyItemListInResponse({
      expectedLength: 4,
      shouldFindItem: { encrypt: false, title: "staged block title", tags: ["blocktag"] },
      encryptBlocksItemsCount: 2,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse(undefined, "staged block content");
  });

  it("Can stage item and convert encryption type before commit", async () => {
    const { itemPage, page } = await createItemPage("/manage/articles/1111");

    // Stage a regular item first
    await itemPage.fillItemDetails("convert staged title", "converttag", "convert staged content");
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    // Load staged item back
    const loadStagedBtn = await itemPage.getByTestId("load-staged-btn");
    await loadStagedBtn.click();
    await itemPage.waitForTimeout();

    // Convert to encrypted item
    await itemPage.toggleEncrypted();
    await itemPage.fillItemDetails("converted encrypted title", undefined, "converted encrypted content");
    await itemPage.enterPassword();

    // Stage the converted item
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    // Navigate to list page and commit
    await page.goto("/manage/articles", { waitUntil: "hydration" });

    const commitStagedBtn = await itemPage.getByTestId("commit-staged-btn");
    await commitStagedBtn.click();
    await itemPage.waitForTimeout();

    const commitStageOkBtn = await itemPage.getByTestId("staged-items-modal-ok");
    await commitStageOkBtn.click();
    await itemPage.waitForTimeout();

    // Verify converted encrypted item was committed
    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: true, tags: [] },
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse(undefined, "converted encrypted content");
  });

  it("Can stage item and convert to encrypted blocks before commit", async () => {
    const { itemPage, page } = await createItemPage("/manage/articles/1111");

    // Stage a regular item first
    await itemPage.fillItemDetails("block convert title", "blockconverttag", "block convert content");
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    // Load staged item back
    const loadStagedBtn = await itemPage.getByTestId("load-staged-btn");
    await loadStagedBtn.click();
    await itemPage.waitForTimeout();

    // Convert to encrypted blocks
    await itemPage.fillItemDetails("converted block title", "convertedblocktag", "[encrypt]\nconverted block content\n[/encrypt]");
    await itemPage.enterPassword();

    // Stage the converted item
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    // Navigate to list page and commit
    await page.goto("/manage/articles", { waitUntil: "hydration" });

    const commitStagedBtn = await itemPage.getByTestId("commit-staged-btn");
    await commitStagedBtn.click();
    await itemPage.waitForTimeout();

    const commitStageOkBtn = await itemPage.getByTestId("staged-items-modal-ok");
    await commitStageOkBtn.click();
    await itemPage.waitForTimeout();

    // Verify converted item with encrypted blocks was committed
    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: false, title: "converted block title", tags: ["convertedblocktag"] },
      encryptBlocksItemsCount: 2,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse(undefined, "converted block content");
  });

  it("Can stage encrypted item and convert to regular item before commit", async () => {
    const { itemPage, page } = await createItemPage("/manage/articles/1111");

    // Stage an encrypted item first
    await itemPage.toggleEncrypted();
    await itemPage.fillItemDetails("encrypted convert title", undefined, "encrypted convert content");
    await itemPage.enterPassword();
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    // Load staged item back
    const loadStagedBtn = await itemPage.getByTestId("load-staged-btn");
    await loadStagedBtn.click();
    await itemPage.waitForTimeout();

    // Convert to regular item
    await itemPage.toggleEncrypted(); // Turn off encryption
    await itemPage.fillItemDetails("converted regular title", "convertedregulartag", "converted regular content");

    // Stage the converted item
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    // Navigate to list page and commit
    await page.goto("/manage/articles", { waitUntil: "hydration" });

    const commitStagedBtn = await itemPage.getByTestId("commit-staged-btn");
    await commitStagedBtn.click();
    await itemPage.waitForTimeout();

    const commitStageOkBtn = await itemPage.getByTestId("staged-items-modal-ok");
    await commitStageOkBtn.click();
    await itemPage.waitForTimeout();

    // Verify converted regular item was committed
    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: false, title: "converted regular title", tags: ["convertedregulartag"] },
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });

    await itemPage.verifyItemContentInResponse("converted regular content");
  });

  it("Can stage multiple items with different encryption types and commit all", async () => {
    const { itemPage, page } = await createItemPage("/manage/articles/1111");

    // Stage first item (convert to encrypted)
    await itemPage.toggleEncrypted();
    await itemPage.enterPassword();
    await itemPage.fillItemDetails("multi encrypted title", undefined, "multi encrypted content");
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    await page.goto("/manage/articles/2222", { waitUntil: "hydration" });
    // Stage second item (convert to regular)
    await itemPage.enterPassword();
    await itemPage.fillItemDetails("multi regular title", "multiregulartag", "multi regular content");
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    await page.goto("/manage/articles/3333", { waitUntil: "hydration" });
    await itemPage.enterPassword();
    // Stage third item (convert to encrypted blocks)
    await itemPage.toggleEncrypted(); // Turn off full encryption
    await itemPage.fillItemDetails("multi block title", "multiblocktag", "[encrypt]\nmulti block content\n[/encrypt]");
    await itemPage.clickElement("item-stage-btn");
    await itemPage.waitForTimeout();

    // Navigate to list page and commit all
    await page.goto("/manage/articles", { waitUntil: "hydration" });

    // Verify commit staged button shows count of 3
    const commitStagedBtn = await itemPage.getByTestId("commit-staged-btn");
    await commitStagedBtn.click();
    await itemPage.waitForTimeout();

    const commitStageOkBtn = await itemPage.getByTestId("staged-items-modal-ok");
    await commitStageOkBtn.click();
    await itemPage.waitForTimeout();

    // Verify all items were committed
    await itemPage.verifyItemListInResponse({
      expectedLength: 3,
      shouldFindItem: { encrypt: true, tags: [] },
      encryptBlocksItemsCount: 1,
      shouldContainEncryptedTitle: true
    });
    await itemPage.verifyItemContentInResponse(undefined, "multi encrypted content");
    await itemPage.verifyItemContentInResponse(undefined, "multi block content");
    await itemPage.verifyItemContentInResponse("multi regular content");
  });
});
