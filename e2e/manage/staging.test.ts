import { describe, expect, it } from "vitest";
import { ARTICLES, ARTICLE_COUNT, NEW_ID, articleListPath, articlePath } from "./fixtures";
import { createItemPage, setupTestEnvironment } from "./test-helpers";

const newArticlePath = articlePath(NEW_ID);

describe("Staging Functionality", async () => {
  await setupTestEnvironment();

  it("stages an item and loads it back", async () => {
    const { itemPage } = await createItemPage(newArticlePath);

    await itemPage.fillItemDetails("staged title", "stagedtag", "staged content");
    await itemPage.stageItem();
    expect(await itemPage.getStagedItems()).lengthOf(1);

    await itemPage.fillInput("item-title-input", "");
    await itemPage.fillInput("item-tags-input", "");
    await itemPage.clearAndTypeInMonacoEditor("");

    await itemPage.loadStaged();

    expect(await itemPage.getInputText("item-title-input")).toBe("staged title");
    expect(await itemPage.getInputText("item-tags-input")).toBe("stagedtag");
  });

  it("stages the same item only once", async () => {
    const { itemPage } = await createItemPage(newArticlePath);

    await itemPage.fillItemDetails("dup title", "duptag", "dup content");
    await itemPage.stageItem();
    await itemPage.stageItem();

    expect(await itemPage.getStagedItems()).lengthOf(1);
  });

  it("deletes a staged item", async () => {
    const { itemPage } = await createItemPage(newArticlePath);

    await itemPage.fillItemDetails("to delete", "deletetag", "delete content");
    await itemPage.stageItem();

    await itemPage.deleteStaged();

    expect(await itemPage.getStagedItems()).lengthOf(0);
    await itemPage.expectDisabled("load-staged-btn");
  });

  it("shows the commit-staged indicator on the list page after staging", async () => {
    const { itemPage, page } = await createItemPage(articlePath(ARTICLES.plain.id));

    await itemPage.fillItemDetails("list staged title", "listtag", "list staged content");
    await itemPage.stageItem();

    await page.goto(articleListPath(), { waitUntil: "hydration" });

    expect(await itemPage.getByTestId("commit-staged-btn").isVisible()).toBe(true);
  });

  it("auto-prompts to load staged changes when returning to the edit page", async () => {
    const { itemPage, page } = await createItemPage(articlePath(ARTICLES.plain.id));

    await itemPage.fillItemDetails("auto load title", "autoloadtag", "auto load content");
    await itemPage.stageItem();

    await page.goto(articleListPath());
    await itemPage.waitForTimeout(500);
    await page.goto(articlePath(ARTICLES.plain.id), { waitUntil: "hydration" });
    await itemPage.waitForTimeout(500);

    expect(await itemPage.getByTestId("load-staged-modal").isVisible()).toBe(true);
  });

  it("commits a staged item", async () => {
    const { itemPage, page } = await createItemPage(articlePath(ARTICLES.plain.id));

    await itemPage.fillItemDetails("commit test title", "committag", "commit test content");
    await itemPage.stageItem();

    await page.goto(articleListPath(), { waitUntil: "hydration" });

    await itemPage.openCommitStagedModal();
    expect(await itemPage.getByTestId("staged-items-modal").isVisible()).toBe(true);

    await itemPage.confirmCommitStaged();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: false, title: "commit test title", tags: ["committag"] },
      blockCount: 1,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ contains: "commit test content" });
    expect(await itemPage.getStagedItems()).lengthOf(0);
  });

  it("stages and loads a fully encrypted item", async () => {
    const { itemPage } = await createItemPage(newArticlePath);

    await itemPage.setEncrypted(true);
    await itemPage.fillItemDetails("encrypted staged title", undefined, "encrypted staged content");
    await itemPage.enterPassword();

    await itemPage.stageItem();

    await itemPage.clearTitleAndContent();

    await itemPage.loadStaged();

    expect(await itemPage.getInputText("item-title-input")).toBe("encrypted staged title");
    expect(await itemPage.getMonacoEditorText()).toContain("encryptedstagedcontent");
    await itemPage.expectChecked("item-encrypt-checkbox");
  });

  it("stages and loads an item with encrypted blocks", async () => {
    const { itemPage } = await createItemPage(newArticlePath);

    await itemPage.fillItemDetails("block staged title", "blocktag", "hello\n[encrypt]\nblock staged content\n[/encrypt]\nworld");
    await itemPage.enterPassword();

    await itemPage.stageItem();

    await itemPage.fillInput("item-title-input", "");
    await itemPage.fillInput("item-tags-input", "");
    await itemPage.clearAndTypeInMonacoEditor("");

    await itemPage.loadStaged();

    expect(await itemPage.getInputText("item-title-input")).toBe("block staged title");
    expect(await itemPage.getInputText("item-tags-input")).toBe("blocktag");
    expect(await itemPage.getMonacoEditorText()).toContain("blockstagedcontent");
  });

  it("stages a fully encrypted item and commits it", async () => {
    const { itemPage, page } = await createItemPage(newArticlePath);

    await itemPage.setEncrypted(true);
    await itemPage.fillItemDetails("staged encrypted title", undefined, "staged encrypted content");
    await itemPage.enterPassword();
    await itemPage.stageItem();

    await page.goto(articleListPath(), { waitUntil: "hydration" });
    await itemPage.commitStaged();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT + 1,
      find: { encrypt: true, tags: [] },
      blockCount: 1,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ excludes: "staged encrypted content" });
  });

  it("stages an item with encrypted blocks and commits it", async () => {
    const { itemPage, page } = await createItemPage(newArticlePath);

    await itemPage.fillItemDetails("staged block title", "blocktag", "[encrypt]\nstaged block content\n[/encrypt]");
    await itemPage.enterPassword();
    await itemPage.stageItem();

    await page.goto(articleListPath(), { waitUntil: "hydration" });
    await itemPage.commitStaged();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT + 1,
      find: { encrypt: false, title: "staged block title", tags: ["blocktag"] },
      blockCount: 2,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ excludes: "staged block content" });
  });

  it("converts a staged item's encryption type before committing", async () => {
    const { itemPage, page } = await createItemPage(articlePath(ARTICLES.plain.id));

    await itemPage.fillItemDetails("convert staged title", "converttag", "convert staged content");
    await itemPage.stageItem();

    await itemPage.loadStaged();

    await itemPage.setEncrypted(true);
    await itemPage.fillItemDetails("converted encrypted title", undefined, "converted encrypted content");
    await itemPage.enterPassword();
    await itemPage.stageItem();

    await page.goto(articleListPath(), { waitUntil: "hydration" });
    await itemPage.commitStaged();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: true, tags: [] },
      blockCount: 1,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ excludes: "converted encrypted content" });
  });

  it("converts a staged item to encrypted blocks before committing", async () => {
    const { itemPage, page } = await createItemPage(articlePath(ARTICLES.plain.id));

    await itemPage.fillItemDetails("block convert title", "blockconverttag", "block convert content");
    await itemPage.stageItem();

    await itemPage.loadStaged();

    await itemPage.fillItemDetails("converted block title", "convertedblocktag", "[encrypt]\nconverted block content\n[/encrypt]");
    await itemPage.enterPassword();
    await itemPage.stageItem();

    await page.goto(articleListPath(), { waitUntil: "hydration" });
    await itemPage.commitStaged();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: false, title: "converted block title", tags: ["convertedblocktag"] },
      blockCount: 2,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ excludes: "converted block content" });
  });

  it("converts a staged encrypted item back to a plain item before committing", async () => {
    const { itemPage, page } = await createItemPage(articlePath(ARTICLES.plain.id));

    await itemPage.setEncrypted(true);
    await itemPage.fillItemDetails("encrypted convert title", undefined, "encrypted convert content");
    await itemPage.enterPassword();
    await itemPage.stageItem();

    await itemPage.loadStaged();

    await itemPage.setEncrypted(false);
    await itemPage.fillItemDetails("converted regular title", "convertedregulartag", "converted regular content");
    await itemPage.stageItem();

    await page.goto(articleListPath(), { waitUntil: "hydration" });
    await itemPage.commitStaged();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: false, title: "converted regular title", tags: ["convertedregulartag"] },
      blockCount: 1,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ contains: "converted regular content" });
  });

  it("stages several items with different encryption types and commits them all", async () => {
    const { itemPage, page } = await createItemPage(articlePath(ARTICLES.plain.id));

    // Plain article → fully encrypted.
    await itemPage.setEncrypted(true);
    await itemPage.enterPassword();
    await itemPage.fillItemDetails("multi encrypted title", undefined, "multi encrypted content");
    await itemPage.stageItem();

    // Block-encrypted article → plain.
    await page.goto(articlePath(ARTICLES.blockEncrypted.id), { waitUntil: "hydration" });
    await itemPage.enterPassword();
    await itemPage.fillItemDetails("multi regular title", "multiregulartag", "multi regular content");
    await itemPage.stageItem();

    // Fully encrypted article → block-encrypted.
    await page.goto(articlePath(ARTICLES.fullEncrypted.id), { waitUntil: "hydration" });
    await itemPage.enterPassword();
    await itemPage.setEncrypted(false);
    await itemPage.fillItemDetails("multi block title", "multiblocktag", "[encrypt]\nmulti block content\n[/encrypt]");
    await itemPage.stageItem();

    expect(await itemPage.getStagedItems()).lengthOf(3);

    await page.goto(articleListPath(), { waitUntil: "hydration" });
    await itemPage.commitStaged();

    itemPage.expectCommittedList({
      length: ARTICLE_COUNT,
      find: { encrypt: true, tags: [] },
      blockCount: 1,
      hasEncryptedTitle: true
    });
    itemPage.expectCommittedContent({ contains: "multi regular content" });
    itemPage.expectCommittedContent({ excludes: "multi encrypted content" });
    itemPage.expectCommittedContent({ excludes: "multi block content" });
  }, 45000);
});
