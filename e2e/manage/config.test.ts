import { describe, expect, it } from "vitest";
import { configPath } from "./fixtures";
import { createConfigPage, setupTestEnvironment } from "./test-helpers";

describe("Config Editing", async () => {
  await setupTestEnvironment();

  it("disables update until the config is modified", async () => {
    const { configPage } = await createConfigPage(configPath());

    expect(await configPage.isUpdateDisabled()).toBe(true);
    await configPage.screenShot();
    await configPage.setContent("{test-config}");
    await configPage.screenShot();
    expect(await configPage.isUpdateDisabled()).toBe(false);
  });

  it("commits the edited config to config.ts", async () => {
    const { configPage } = await createConfigPage(configPath());

    await configPage.updateConfig("{test-config}");

    expect(configPage.requestAdditions[0]?.path).toBe("config.ts");
    expect(configPage.getCommittedConfig()).toContain("{test-config}");
  });
});
