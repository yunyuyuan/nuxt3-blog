import { describe, expect, it } from "vitest";
import type { ArticleItem } from "../../app/utils/common/types";
import { ARTICLES, ARTICLE_COUNT, articleListPath } from "./fixtures";
import { createListPage, setupTestEnvironment } from "./test-helpers";

describe("List Editing", async () => {
  await setupTestEnvironment();

  it("deletes a selected item", async () => {
    const { listPage } = await createListPage(articleListPath());

    await listPage.expectDisabled("list-delete-btn");

    await listPage.selectItemByIndex(0);
    await listPage.expectDisabled("list-delete-btn", false);

    await listPage.deleteSelectedItems();

    const list = listPage.getCommittedList<ArticleItem>();
    expect(list.find(i => i.id === ARTICLES.plain.id)).toBeUndefined();
    // Untouched encrypted siblings are preserved in the committed list.
    expect(list.find(i => i.encryptBlocks?.length)).toBeDefined();
    expect(list.find(i => i.encrypt && i.title === ARTICLES.fullEncrypted.encryptedTitle)).toBeDefined();

    listPage.expectDeletedFiles(`${ARTICLES.plain.id}.md`);
  });

  it("decrypts titles in the list after entering the password", async () => {
    const { listPage } = await createListPage(articleListPath());

    expect(await listPage.getListItemsText()).toContain(ARTICLES.fullEncrypted.encryptedTitle);

    await listPage.enterPassword();

    expect(await listPage.getListItemsText()).not.toContain(ARTICLES.fullEncrypted.encryptedTitle);

    await listPage.selectItemByIndex(0);
    await listPage.expectDisabled("list-delete-btn", false);
    await listPage.deleteSelectedItems();

    const list = listPage.getCommittedList<ArticleItem>();
    expect(list.find(i => i.id === ARTICLES.plain.id)).toBeUndefined();
    listPage.expectDeletedFiles(`${ARTICLES.plain.id}.md`);
  });

  it("filters rows by the search box", async () => {
    const { listPage } = await createListPage(articleListPath());

    expect(await listPage.getRowCount()).toBe(ARTICLE_COUNT);

    // Two plain articles share the title "test"; the encrypted one does not.
    await listPage.search("test");
    expect(await listPage.getRowCount()).toBe(2);

    await listPage.search("");
    expect(await listPage.getRowCount()).toBe(ARTICLE_COUNT);
  });

  it("deletes several selected items at once", async () => {
    const { listPage } = await createListPage(articleListPath());

    await listPage.selectItemByIndex(0); // plain
    await listPage.selectItemByIndex(1); // block-encrypted
    await listPage.expectDisabled("list-delete-btn", false);

    await listPage.deleteSelectedItems();

    const list = listPage.getCommittedList<ArticleItem>();
    expect(list).lengthOf(ARTICLE_COUNT - 2);
    expect(list.find(i => i.id === ARTICLES.plain.id)).toBeUndefined();
    expect(list.find(i => i.id === ARTICLES.blockEncrypted.id)).toBeUndefined();

    listPage.expectDeletedFiles(`${ARTICLES.plain.id}.md`, `${ARTICLES.blockEncrypted.id}.md`);
  });
});
