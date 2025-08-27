import { describe, expect, it } from "vitest";
import type { ArticleItem } from "../../app/utils/common/types";
import { createListPage, setupTestEnvironment } from "./test-helpers";

describe("List Editing", async () => {
  await setupTestEnvironment();

  it("Deleting works", async () => {
    const { listPage } = await createListPage("/manage/articles");

    const deleteBtn = await listPage.getByTestId("list-delete-btn");
    expect(deleteBtn).not.toBeNull();
    expect(await deleteBtn.isDisabled()).toBe(true);

    await listPage.selectItemByIndex(0);
    expect(await deleteBtn.isDisabled()).toBe(false);

    await listPage.deleteSelectedItems();

    const additionList = JSON.parse(listPage.requestAdditions[0].content || "") as ArticleItem[];
    expect(additionList.find(i => i.id === 1111)).toBeUndefined();
    expect(additionList.find(i => i.encryptBlocks?.length)).toBeDefined();
    expect(additionList.find(i => i.encrypt && i.title === "U2FsdGVkX18wyEu7vCLMOGilOsG2cQdWY+kvi3b+AZE=")).toBeDefined();

    const deletionItem = listPage.requestDeletions[0].path || "";
    expect(deletionItem).toContain("1111.md");
  });

  it("Deleting works after entering password", async () => {
    const { listPage } = await createListPage("/manage/articles");

    const deleteBtn = await listPage.getByTestId("list-delete-btn");
    expect(deleteBtn).not.toBeNull();
    expect(await deleteBtn.isDisabled()).toBe(true);

    const listItemsText = await listPage.getListItemsText();
    expect(listItemsText).toContain("U2FsdGVkX18wyEu7vCLMOGilOsG2cQdWY+kvi3b+AZE=");

    await listPage.enterPassword();

    const updatedListItemsText = await listPage.getListItemsText();
    expect(updatedListItemsText).not.toContain("U2FsdGVkX18wyEu7vCLMOGilOsG2cQdWY+kvi3b+AZE=");

    await listPage.selectItemByIndex(0);
    expect(await deleteBtn.isDisabled()).toBe(false);

    await listPage.deleteSelectedItems();

    const additionList = JSON.parse(listPage.requestAdditions[0].content || "") as ArticleItem[];
    expect(additionList.find(i => i.id === 1111)).toBeUndefined();
    expect(additionList.find(i => i.encryptBlocks?.length)).toBeDefined();
    expect(additionList.find(i => i.encrypt && i.title === "U2FsdGVkX18wyEu7vCLMOGilOsG2cQdWY+kvi3b+AZE=")).toBeDefined();

    const deletionItem = listPage.requestDeletions[0].path || "";
    expect(deletionItem).toContain("1111.md");
  });
});
