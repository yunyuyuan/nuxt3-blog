import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it } from "vitest";
import { useBlogList } from "./useBlogList";
import type { ArticleItem } from "../common";

const timeout = () => new Promise((resolve) => {
  setTimeout(resolve, 16);
});

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

describe("useBlogList", () => {
  const encryptor = useEncryptor();

  beforeEach(() => {
    encryptor.usePasswd.value = "";
  });

  it("should return originList and decryptedList", async () => {
    const { originList, decryptedList } = await useBlogList("/articles");
    expect(originList).lengthOf(3);
    expect(decryptedList.value).lengthOf(3);
  });

  it("should success decrypt already correct", async () => {
    encryptor.usePasswd.value = "123";
    await timeout();
    const { decryptedList } = await useBlogList<ArticleItem>("/articles");
    expect(decryptedList.value?.[2].title).toBe("test");
  });

  it("should success decrypt correct -> incorrect", async () => {
    const { decryptedList } = await useBlogList<ArticleItem>("/articles");
    encryptor.usePasswd.value = "123";
    await timeout();
    expect(decryptedList.value?.[2].title).toBe("test");
    encryptor.usePasswd.value = "456";
    await timeout();
    expect(decryptedList.value?.[2].title).toBe("test");
  });

  it("should success decrypt incorrect -> correct", async () => {
    const { decryptedList } = await useBlogList<ArticleItem>("/articles", 3333);
    encryptor.usePasswd.value = "456";
    await timeout();
    expect(decryptedList.value?.[2].title).not.toBe("test");
    encryptor.usePasswd.value = "123";
    await timeout();
    expect(decryptedList.value?.[2].title).toBe("test");
  });
});