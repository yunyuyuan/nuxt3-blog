import { expect } from "vitest";
import type { NuxtPage } from "@nuxt/test-utils";
import { ref, unref } from "vue";
import type { CommitParams } from "../../../app/utils/common/types";
import { STAGING_KEY, TEST_PASSWORD } from "../../manage/fixtures";

/**
 * Base page object for the manage area.
 *
 * It stubs the GitHub GraphQL endpoint so tests can assert on the commit
 * payload the UI *would* push, without hitting the network. In test mode
 * `createCommit` posts `JSON.stringify({ additions, deletions })` as the
 * `query` field (see `app/utils/nuxt/manage/github.ts`), which we capture here.
 */
export class ManageBasePage {
  private requestDataRef = ref<CommitParams>();

  constructor(protected page: NuxtPage) {
    page.route("https://api.github.com/graphql", async (route) => {
      this.requestDataRef.value = JSON.parse(route.request().postDataJSON().query);
      await route.fulfill({ json: { data: {} } });
    });
  }

  /** The file additions of the captured commit (empty when nothing committed). */
  get requestAdditions() {
    return unref(this.requestDataRef)?.additions || [];
  }

  /** The file deletions of the captured commit (empty when nothing committed). */
  get requestDeletions() {
    return unref(this.requestDataRef)?.deletions || [];
  }

  /** Whether a commit was sent to GitHub at all. */
  get committed() {
    return unref(this.requestDataRef) !== undefined;
  }

  /** Parse the JSON content of one addition (defaults to the list json). */
  parseAddition<T>(index = 0): T {
    return JSON.parse(this.requestAdditions[index]?.content || "null") as T;
  }

  // ---------------------------------------------------------------------------
  // Low-level helpers
  // ---------------------------------------------------------------------------

  async waitForTimeout(ms = 200) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getByTestId(testId: string) {
    return this.page.getByTestId(testId);
  }

  /** Wait until an element appears (defaults to waiting for it to be visible). */
  async waitForTestId(testId: string, state: "attached" | "visible" = "visible") {
    await this.getByTestId(testId).waitFor({ state });
  }

  async fillInput(testId: string, value: string) {
    const input = this.getByTestId(testId);
    await input.fill(value);
    await this.waitForTimeout();
    return input;
  }

  async clickElement(testId: string) {
    const element = this.getByTestId(testId);
    await element.click();
    await this.waitForTimeout();
    return element;
  }

  // ---------------------------------------------------------------------------
  // Monaco editor
  // ---------------------------------------------------------------------------

  async getMonacoEditor() {
    return this.page.locator(".monaco-editor").nth(0);
  }

  async clearAndTypeInMonacoEditor(content: string) {
    const monacoEditor = await this.getMonacoEditor();
    await monacoEditor.click();
    await this.page.keyboard.press("ControlOrMeta+KeyA");
    await this.page.keyboard.type(content);
    await this.waitForTimeout();
    return monacoEditor;
  }

  async getMonacoEditorText() {
    return (await (await this.getMonacoEditor()).textContent())?.replace(/\s+/g, "");
  }

  // ---------------------------------------------------------------------------
  // State queries
  // ---------------------------------------------------------------------------

  isElementDisabled(testId: string) {
    return this.getByTestId(testId).isDisabled();
  }

  getInputText(testId: string) {
    return this.getByTestId(testId).inputValue();
  }

  getElementText(testId: string) {
    return this.getByTestId(testId).innerText();
  }

  isChecked(testId: string) {
    return this.getByTestId(testId).isChecked();
  }

  // ---------------------------------------------------------------------------
  // Assertions
  // ---------------------------------------------------------------------------

  /** Assert an element's disabled state (defaults to expecting disabled). */
  async expectDisabled(testId: string, disabled = true) {
    expect(await this.isElementDisabled(testId)).toBe(disabled);
  }

  /** Assert a checkbox's checked state (defaults to expecting checked). */
  async expectChecked(testId: string, checked = true) {
    expect(await this.isChecked(testId)).toBe(checked);
  }

  /** Assert that no commit was sent (e.g. an action was blocked by validation). */
  expectNoCommit() {
    expect(this.committed).toBe(false);
  }

  // ---------------------------------------------------------------------------
  // Shared actions
  // ---------------------------------------------------------------------------

  /** Toggle a `common-checkbox` to an explicit value, clicking only if needed. */
  async setChecked(testId: string, checked: boolean) {
    if (await this.isChecked(testId) !== checked) {
      await this.clickElement(testId);
    }
  }

  /** Open the token/password modal and submit the given password. */
  async enterPassword(password = TEST_PASSWORD) {
    await this.clickElement("show-token-password-btn");
    await this.waitForTimeout();
    await this.fillInput("password-input", password);
    await this.clickElement("token-password-confirm");
    await this.waitForTimeout(1500);
  }

  /** Read the staged items straight from localStorage (source of truth). */
  async getStagedItems(): Promise<unknown[]> {
    return this.page.evaluate((key) => {
      const raw = localStorage.getItem(key);
      return raw ? JSON.parse(raw) : [];
    }, STAGING_KEY);
  }

  async screenShot() {
    await this.page.screenshot({ path: "screenshot.png" });
  }
}
