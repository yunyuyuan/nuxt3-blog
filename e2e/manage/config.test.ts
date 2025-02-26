import { createPage, setup } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";
import { confirmForceCommit, mockGithubGraphApi, timeout } from "../utils";


describe("Config Editing", async () => {
  await setup({
    host: "http://localhost:3000",
  });

  it("Editing Works", async () => {
    const page = await createPage("/manage/config");

    const btn = await page.locator(".manage-config button.primary");
    expect(btn).not.toBeNull();
    
    const monacoEditor = page.locator(".monaco-editor").nth(0);
    await monacoEditor.click();
    await page.keyboard.press("Meta+KeyA");
    await page.keyboard.type("{test-config}");
    await nextTick();
    expect(await btn.isDisabled()).toBe(false);

    const requestDataRef = await mockGithubGraphApi(page);
    await btn.click();
    
    await confirmForceCommit(page);

    await timeout();
    expect(unref(requestDataRef)).toContain("{test-config}");
  });
});