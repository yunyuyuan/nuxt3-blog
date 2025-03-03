import type { NuxtPage } from "@nuxt/test-utils";

export class ManageBasePage {
  protected requestDataRef = ref<{
    additions: { path: string; content: string }[];
    deletions: { path: string }[];
  }>();

  constructor(protected page: NuxtPage) {
    page.route("https://api.github.com/graphql", async (route) => {
      this.requestDataRef.value = JSON.parse(route.request().postDataJSON().query);
      await route.fulfill({ json: { data: {} } });
    });
  }

  get requestAdditions() {
    return unref(this.requestDataRef)?.additions || [];
  }

  get requestDeletions() {
    return unref(this.requestDataRef)?.deletions || [];
  }

  async screenShot() {
    await this.page.screenshot({ path: "screenshot.png" });
  }

  async waitForTimeout(ms = 200) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  async getByTestId(testId: string) {
    return this.page.getByTestId(testId);
  }

  async fillInput(testId: string, value: string) {
    const input = await this.getByTestId(testId);
    await input.fill(value);
    await this.waitForTimeout();
    return input;
  }

  async clickElement(testId: string) {
    const element = await this.getByTestId(testId);
    await element.click();
    await this.waitForTimeout();
    return element;
  }

  async clearAndTypeInMonacoEditor(content: string) {
    const monacoEditor = this.page.locator(".monaco-editor").nth(0);
    await monacoEditor.click();
    await this.page.keyboard.press("ControlOrMeta+KeyA");
    await this.page.keyboard.type(content);
    await this.waitForTimeout();
    return monacoEditor;
  }

  async isElementDisabled(testId: string) {
    const element = await this.getByTestId(testId);
    return element.isDisabled();
  }

  async getElementText(testId: string) {
    const element = await this.getByTestId(testId);
    return element.innerText();
  }

  async enterPassword() {
    this.clickElement("show-token-password-btn");
    await this.waitForTimeout();
    this.fillInput("password-input", "123");
    this.clickElement("token-password-confirm");
    await this.waitForTimeout(1000);
  };
}
