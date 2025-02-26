import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it } from "vitest";
import ManageListTable from "../comps/manage-list-table.vue";
import ListComponent from "./index.vue";
import type { ArticleItem } from "~/utils/common/types";

registerEndpoint("/rebuild/json/articles.json", () => [
  {
    id: 1111,
    time: 0,
    modifyTime: 0,
    encrypt: false,
    showComments: true,
    title: "test",
    len: 1234,
    tags: ["tag1", "tag2"],
  },{
    id: 2222,
    time: 0,
    modifyTime: 0,
    encrypt: false,
    encryptBlocks: [{"start":86,"end":130},{"start":15,"end":59}],
    showComments: false,
    title: "test",
    len: 1234,
    tags: ["tag1", "tag2"],
  },{
    id: 3333,
    time: 0,
    modifyTime: 0,
    encrypt: true,
    showComments: false,
    title: "U2FsdGVkX18wyEu7vCLMOGilOsG2cQdWY+kvi3b+AZE=",
    len: 1234,
    tags: [],
  },
] as ArticleItem[]);

const timeout = () => new Promise((resolve) => setTimeout(resolve, 32));

describe("ManageListTable", async () => {
  const encryptor = useEncryptor();

  beforeEach(() => {
    encryptor.usePasswd.value = "";
  });

  it("should work", async () => {
    const component = await mountSuspended(ListComponent, {
      route: "/manage/articles",
    });

    const manageListEditComponent = component.getComponent(ManageListTable);

    const originList = unref(manageListEditComponent.vm.originList);
    manageListEditComponent.vm.changeSelect(originList[0]);
    await nextTick();
    expect(unref(manageListEditComponent.vm.selectedList)).lengthOf(1);

    manageListEditComponent.vm.searchValue = "not in";
    await nextTick();
    expect(unref(manageListEditComponent.vm.newListToUpdate)).lengthOf(3);

    manageListEditComponent.vm.searchValue = "";
    await nextTick();
    expect(unref(manageListEditComponent.vm.selectedList)).lengthOf(0);

    manageListEditComponent.vm.changeSelect(originList[0]);
    await nextTick();
    expect(unref(manageListEditComponent.vm.selectedList)).lengthOf(1);
    expect(unref(manageListEditComponent.vm.newListToUpdate)).lengthOf(2);
  });

  it("should remain encrypted after decrypted", async () => {
    const component = await mountSuspended(ListComponent, {
      route: "/manage/articles",
    });

    const manageListEditComponent = component.getComponent(ManageListTable);

    encryptor.usePasswd.value = "123";
    await timeout();
    
    expect(unref(manageListEditComponent.vm.decryptedList)[2].title).toEqual("test");

    const originList = unref(manageListEditComponent.vm.originList);
    manageListEditComponent.vm.changeSelect(originList[1]);
    await nextTick();

    expect(manageListEditComponent.vm.selectedList).lengthOf(1);

    const newListToUpdate = unref(manageListEditComponent.vm.newListToUpdate);
    expect(newListToUpdate[0].title).toEqual("test");
    expect(newListToUpdate[1].title).not.toEqual("test");
  });
});