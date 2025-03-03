import { describe, expect, it } from "vitest";
import { createConfigPage, setupTestEnvironment } from "./test-helpers";

describe("Config Editing", async () => {
  await setupTestEnvironment();

  it("Editing Works", async () => {
    const { configPage } = await createConfigPage("/manage/config");

    const btn = await configPage.getByTestId("update-config-btn");
    expect(await btn.isDisabled()).toBe(true);

    await configPage.updateConfig("{test-config}");

    expect(configPage.requestAdditions[0].content).toContain("{test-config}");
  });
});
