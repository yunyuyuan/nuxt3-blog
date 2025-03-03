import { ManageBasePage } from "./BasePage";

export class ManageListPage extends ManageBasePage {
  async selectItemByIndex(index: number) {
    const checkbox = await this.getByTestId(`list-item-check-${index}`);
    await checkbox.click();
    await this.waitForTimeout();
    return checkbox;
  }

  async deleteSelectedItems() {
    const deleteBtn = await this.getByTestId("list-delete-btn");
    await deleteBtn.click();
    await this.clickElement("confirm-list-delete");
    await this.waitForTimeout();
  }

  async getListItemsText() {
    const listItems = await this.getByTestId("list-items");
    return listItems.innerText();
  }
}
