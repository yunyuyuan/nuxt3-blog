import { createPage, setup } from "@nuxt/test-utils/e2e";
import { ManageItemPage } from "../page-objects/manage/ItemPage";
import { ManageListPage } from "../page-objects/manage/ListPage";
import { ManageConfigPage } from "../page-objects/manage/ConfigPage";

export const setupTestEnvironment = async () => {
  await setup({
    host: "http://localhost:13000"
  });
};

export const createItemPage = async (path: string) => {
  const page = await createPage(path);
  const itemPage = new ManageItemPage(page);
  return { page, itemPage };
};

export const createListPage = async (path: string) => {
  const page = await createPage(path);
  const listPage = new ManageListPage(page);
  return { page, listPage };
};

export const createConfigPage = async (path: string) => {
  const page = await createPage(path);
  const configPage = new ManageConfigPage(page);
  return { page, configPage };
};
