import { createPage, setup } from "@nuxt/test-utils/e2e";
import { ManageItemPage } from "../page-objects/manage/ItemPage";
import { ManageListPage } from "../page-objects/manage/ListPage";
import { ManageConfigPage } from "../page-objects/manage/ConfigPage";
import { BASE_URL } from "./fixtures";

export const setupTestEnvironment = () => setup({ host: BASE_URL });

/** Open a manage page and start every test from a clean localStorage. */
const openPage = async (path: string) => {
  const page = await createPage(path, { baseURL: BASE_URL });
  // Awaited so staged items / dismissed modals never leak between tests.
  await page.evaluate(() => localStorage.clear());
  return page;
};

export const createItemPage = async (path: string) => {
  const page = await openPage(path);
  return { page, itemPage: new ManageItemPage(page) };
};

export const createListPage = async (path: string) => {
  const page = await openPage(path);
  return { page, listPage: new ManageListPage(page) };
};

export const createConfigPage = async (path: string) => {
  const page = await openPage(path);
  return { page, configPage: new ManageConfigPage(page) };
};

/** Open a page without any page object — for plain navigation assertions. */
export const createBlankPage = (path: string) => openPage(path);
