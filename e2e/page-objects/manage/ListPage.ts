import { expect } from "vitest";
import type { CommonItem } from "../../../app/utils/common/types";
import { ManageBasePage } from "./BasePage";

/** Page object for the manage list table (`/manage/<tab>`). */
export class ManageListPage extends ManageBasePage {
  /** The single search box rendered inside the list `<main>`. */
  private get searchInput() {
    return this.page.locator("main input[type='text']").first();
  }

  /** Number of rows currently shown in the table body. */
  getRowCount() {
    return this.page.locator("[data-testid='list-items'] > tr").count();
  }

  getListItemsText() {
    return this.getByTestId("list-items").innerText();
  }

  async search(text: string) {
    await this.searchInput.fill(text);
    await this.waitForTimeout();
  }

  async selectItemByIndex(index: number) {
    await this.clickElement(`list-item-check-${index}`);
  }

  async deleteSelectedItems() {
    await this.getByTestId("list-delete-btn").click();
    await this.clickElement("confirm-list-delete");
    await this.waitForTimeout();
  }

  // ---------------------------------------------------------------------------
  // Commit-payload assertions
  // ---------------------------------------------------------------------------

  /** The full list as committed to the json file. */
  getCommittedList<T extends CommonItem = CommonItem>() {
    return this.parseAddition<T[]>(0);
  }

  /** Assert which markdown files the deletion commit targets. */
  expectDeletedFiles(...fileNames: string[]) {
    const paths = this.requestDeletions.map(d => d.path || "");
    expect(paths).lengthOf(fileNames.length);
    for (const name of fileNames) {
      expect(paths.some(p => p.endsWith(name)), `expected a deletion ending with ${name}`).toBe(true);
    }
    return paths;
  }
}
