import { registerEndpoint } from "@nuxt/test-utils/runtime";
import { beforeEach, describe, expect, it } from "vitest";
import type { ArticleItem } from "../common/types";
import { useBlogItem } from "./useBlogItem";

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
    len: 4,
    tags: ["tag1", "tag2"]
  }, {
    id: 2222,
    time: 0,
    modifyTime: 0,
    encrypt: false,
    encryptBlocks: [{ start: 86, end: 130 }, { start: 15, end: 59 }],
    showComments: false,
    title: "test",
    len: 61,
    tags: ["tag1", "tag2"]
  }, {
    id: 3333,
    time: 0,
    modifyTime: 0,
    encrypt: true,
    showComments: false,
    title: "U2FsdGVkX18wyEu7vCLMOGilOsG2cQdWY+kvi3b+AZE=",
    len: 4,
    tags: []
  }
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

describe("useBlogItem", () => {
  const encryptor = useEncryptor();

  beforeEach(() => {
    encryptor.usePasswd.value = "";
  });

  it("should return list and item", async () => {
    const { originList, decryptedList, successDecrypt, originItem, originMd, decryptedItem, decryptedMd } = await useBlogItem<ArticleItem>("1111", "/articles");
    expect(originList).lengthOf(3);
    expect(decryptedList.value).lengthOf(3);
    expect(successDecrypt.value).toBe(true);
    expect(originItem).not.toBe(null);
    expect(originMd).not.toBe("");
    expect(decryptedItem.value).not.toBe(null);
    expect(decryptedMd.value).not.toBe("");
  });

  it("should success decrypt immediately", async () => {
    encryptor.usePasswd.value = "123";
    await timeout();
    const { successDecrypt, originItem, originMd, decryptedItem, decryptedMd } = await useBlogItem<ArticleItem>("3333", "/articles");
    expect(successDecrypt.value).toBe(true);
    expect(originItem?.title).not.toBe("test");
    expect(originMd).not.toBe("test");
    expect(decryptedItem.value.title).toBe("test");
    expect(decryptedMd.value).toBe("test");
  });

  it("should success decrypt correct -> incorrect", async () => {
    const { successDecrypt, decryptedItem, decryptedMd } = await useBlogItem<ArticleItem>("3333", "/articles");
    expect(successDecrypt.value).toBe(false);
    encryptor.usePasswd.value = "123";
    await timeout();
    expect(successDecrypt.value).toBe(true);
    expect(decryptedItem.value.title).toBe("test");
    expect(decryptedMd.value).toBe("test");

    encryptor.usePasswd.value = "456";
    await timeout();
    expect(successDecrypt.value).toBe(true);
    expect(decryptedItem.value.title).toBe("test");
    expect(decryptedMd.value).toBe("test");
  });
  it("should success decrypt incorrect -> correct", async () => {
    const { successDecrypt, decryptedItem, decryptedMd } = await useBlogItem<ArticleItem>("3333", "/articles");
    expect(successDecrypt.value).toBe(false);

    encryptor.usePasswd.value = "456";
    await timeout();
    expect(successDecrypt.value).toBe(false);

    encryptor.usePasswd.value = "123";
    await timeout();
    expect(decryptedItem.value.title).toBe("test");
    expect(decryptedMd.value).toBe("test");
  });

  it("should success decrypt blocks", async () => {
    const { successDecrypt, decryptedItem, decryptedMd } = await useBlogItem<ArticleItem>("2222", "/articles");
    expect(successDecrypt.value).toBe(false);
    expect(decryptedMd.value.match(/test/g)).lengthOf(2);

    encryptor.usePasswd.value = "123";
    await timeout();
    expect(successDecrypt.value).toBe(true);
    expect(decryptedItem.value.title).toBe("test");
    expect(decryptedMd.value.match(/test/g)).lengthOf(4);
  });
});
