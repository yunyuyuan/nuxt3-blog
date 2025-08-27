import { createPage, setup } from "@nuxt/test-utils/e2e";
import { ManageItemPage } from "../page-objects/manage/ItemPage";
import { ManageListPage } from "../page-objects/manage/ListPage";
import { ManageConfigPage } from "../page-objects/manage/ConfigPage";

const baseURL = "http://localhost:13000";

export const setupTestEnvironment = async () => {
  await setup({
    host: baseURL
  });
};

const createPageWithBaseURL = async (path: string) => {
  const page = await createPage(path, {
    baseURL
  });
  page.evaluate(() => {
    localStorage.clear();
  });
  return page;
};

export const createItemPage = async (path: string) => {
  const page = await createPageWithBaseURL(path);
  const itemPage = new ManageItemPage(page);
  return { page, itemPage };
};

export const createListPage = async (path: string) => {
  const page = await createPageWithBaseURL(path);
  const listPage = new ManageListPage(page);
  return { page, listPage };
};

export const createConfigPage = async (path: string) => {
  const page = await createPageWithBaseURL(path);
  const configPage = new ManageConfigPage(page);
  return { page, configPage };
};
