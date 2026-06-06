import { ManageBasePage } from "./BasePage";

/** Page object for the config editor (`/manage/config`). */
export class ManageConfigPage extends ManageBasePage {
  isUpdateDisabled() {
    return this.isElementDisabled("update-config-btn");
  }

  async setContent(content: string) {
    await this.clearAndTypeInMonacoEditor(content);
  }

  async clickUpdate() {
    await this.clickElement("update-config-btn");
  }

  /** Type new config content and commit it. */
  async updateConfig(content: string) {
    await this.setContent(content);
    await this.clickUpdate();
  }

  /** The committed `config.ts` content (or empty string if not committed). */
  getCommittedConfig() {
    return this.requestAdditions[0]?.content || "";
  }
}
