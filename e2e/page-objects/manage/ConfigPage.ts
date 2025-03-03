import { ManageBasePage } from "./BasePage";

export class ManageConfigPage extends ManageBasePage {
  async updateConfig(content: string) {
    await this.clearAndTypeInMonacoEditor(content);
    await this.clickElement("update-config-btn");
    await this.waitForTimeout();
  }
}
