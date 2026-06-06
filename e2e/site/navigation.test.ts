import { describe, expect, it } from "vitest";
import { ARTICLES } from "../manage/fixtures";
import { createBlankPage, setupTestEnvironment } from "../manage/test-helpers";

const detailPath = `/articles/${ARTICLES.plain.id}`;

describe("Public Navigation", async () => {
  await setupTestEnvironment();

  it("navigates the article list → detail → back to the list", async () => {
    const page = await createBlankPage("/articles");

    const articleLink = page.locator(`main article a[href="${detailPath}"]`).first();
    await articleLink.waitFor();

    // List → detail.
    await articleLink.click();
    await page.locator("main h1").waitFor();
    expect(page.url()).toContain(detailPath);
    expect(await page.locator("main h1").innerText()).toBe(ARTICLES.plain.title);

    // Detail → back to the list via the header tab.
    // (`main article` also matches the detail page's markdown body, so wait on
    // the URL instead — the out-in transition means the swap isn't instant.)
    await page.locator("nav a[href='/articles']").first().click();
    await page.waitForURL(/\/articles\/?$/);
    expect(page.url()).toMatch(/\/articles\/?$/);
  });
});
