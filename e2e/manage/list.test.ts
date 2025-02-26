import { createPage, setup } from "@nuxt/test-utils/e2e";
import { describe, expect, it } from "vitest";
import { mockGithubGraphApi, timeout } from "../utils";


describe("List Editing", async () => {
  await setup({
    host: "http://localhost:3000",
  });

  it("Showing Works", async () => {
    const page = await createPage("/manage/articles");

    const deleteBtn = await page.locator(".manage-list-head button.danger");
    expect(deleteBtn).not.toBeNull();
    expect(await deleteBtn.isDisabled()).toBe(true);

    const list = await page.locator("ul.manage-list-table");
    expect(list).not.toBeNull();
    
    const items = await list.locator("li.list-body").all();
    const length = items.length;
    
    if (length > 0) {
      (await items[0].locator(".common-checkbox")).click();
      await timeout();
      expect(await deleteBtn.isDisabled()).toBe(false);

      const requestDataPromise = await mockGithubGraphApi(page);
      await deleteBtn.click();
      
      while (true) {
        const confirmBtn = await page.locator(".common-modal:not([style]) .modal-foot button.ok");
        if (confirmBtn) {
          await page.screenshot({ path: "screenshot.png"});
          await confirmBtn.click();
        } else {
          break;
        }
      }
  
      await timeout();
      const actualPostData = await requestDataPromise;
      expect(actualPostData).not.toContain("1111");
      expect(actualPostData).toContain("U2FsdGVkX18wyEu7vCLMOGilOsG2cQdWY+kvi3b+AZE=");
    }
  }, {
    timeout: 10000
  });
});