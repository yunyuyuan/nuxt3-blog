import { mountSuspended, registerEndpoint } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it } from "vitest";
import DetailComponent from "./[id].vue";
import ManageContentEdit from "../comps/manage-content-edit.vue";
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

registerEndpoint("/rebuild/articles/1111.md", () => "test");
registerEndpoint("/rebuild/articles/2222.md", () => `test
[encrypt]
U2FsdGVkX19x3vz71QYkQDP6Mo0nbZGCRDdIWK0DoBs=
[/encrypt]
test
[encrypt]
U2FsdGVkX191jslHj/zf0feLh6mxQ2l871FVGjPE5Kg=
[/encrypt]`);
registerEndpoint("/rebuild/articles/3333.md", () => "U2FsdGVkX18wyEu7vCLMOGilOsG2cQdWY+kvi3b+AZE=");

const timeout = () => new Promise((resolve) => setTimeout(resolve, 32));

describe("ManageListTable", async () => {
  const encryptor = useEncryptor();

  beforeEach(() => {
    encryptor.usePasswd.value = "";
  });

  it("should work", async () => {
    const component = await mountSuspended(DetailComponent, {
      route: "/manage/articles/1111",
    });
     
    const manageContentEditComponent = component.getComponent(ManageContentEdit);
    
    await timeout();
    expect(manageContentEditComponent.vm).not.toBeFalsy();
  });
});