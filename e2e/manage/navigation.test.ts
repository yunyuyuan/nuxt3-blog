import { describe, expect, it } from "vitest";
import { ARTICLES, NEW_ID, articleListPath, articlePath, configPath } from "./fixtures";
import { createListPage, setupTestEnvironment } from "./test-helpers";

const detailPath = articlePath(ARTICLES.plain.id);
const newPath = articlePath(NEW_ID);

describe("Manage Navigation", async () => {
  await setupTestEnvironment();

  it("wires every tab in the sidebar", async () => {
    const { page, listPage } = await createListPage(articleListPath());
    await listPage.waitForTestId("list-delete-btn");

    for (const href of ["/manage/articles", "/manage/records", "/manage/knowledges", "/manage/config"]) {
      expect(await page.locator(`a[href="${href}"]`).count(), `missing sidebar link ${href}`).toBeGreaterThan(0);
    }
  });

  it("navigates list → detail → config → list → new", async () => {
    const { page, listPage } = await createListPage(articleListPath());
    await listPage.waitForTestId("list-delete-btn");

    // List → detail (open the plain article via its row link).
    await page.locator(`a[href="${detailPath}"]`).first().click();
    await listPage.waitForTestId("item-upload-btn");
    expect(page.url()).toContain(detailPath);
    expect(await listPage.getInputText("item-title-input")).toBe(ARTICLES.plain.title);

    // Detail → config (sidebar).
    await page.locator(`a[href="${configPath()}"]`).click();
    await listPage.waitForTestId("update-config-btn");
    expect(page.url()).toMatch(/\/manage\/config\/?$/);

    // Config → list (sidebar).
    await page.locator(`a[href="${articleListPath()}"]`).click();
    await listPage.waitForTestId("list-delete-btn");
    expect(page.url()).toMatch(/\/manage\/articles\/?$/);

    // List → new item.
    await page.locator(`a[href="${newPath}"]`).click();
    await listPage.waitForTestId("item-upload-btn");
    expect(page.url()).toContain(newPath);
    expect(await listPage.getInputText("item-title-input")).toBe("");
  });
});
