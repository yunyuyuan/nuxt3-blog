import { describe, expect, it } from "vitest";
import { decryptEncryptBlocks, encryptDecryptItem, findEncryptBlocks, getEncryptedBlocks, hideEncryptBlocks, showEncryptBlocksPlaceholder } from "./process-encrypt-decrypt";
import type { RecordItem } from "./types";

// 假的加解密：密文比明文长，与真实密文一样不含换行
const encrypt = async (s: string) => "ENC(" + Buffer.from(s).toString("base64") + ")";
const decrypt = async (s: string) => Buffer.from(s.slice(4, -1), "base64").toString();

const plain = "# title\n[encrypt]\nsecret one\n[/encrypt]\ntext\n[encrypt]\nsecret\ntwo\n[/encrypt]\n[encrypt]\nthree\n[/encrypt]\nend";

describe("findEncryptBlocks", () => {
  it("returns the same offsets that getEncryptedBlocks stores", async () => {
    const { md, blocks } = await getEncryptedBlocks(plain, encrypt);
    // 写入时保存的顺序是 blocks.reverse()
    expect(findEncryptBlocks(md)).toEqual([...blocks].reverse());
    expect(findEncryptBlocks(md)).toHaveLength(3);
    expect(await decryptEncryptBlocks(md, decrypt)).toBe(plain);
  });

  it("still finds the blocks after the text before them changes", async () => {
    const { md } = await getEncryptedBlocks(plain, encrypt);
    const edited = "new first line\n\n" + md.replace("text", "longer text here");
    expect(await decryptEncryptBlocks(edited, decrypt)).toBe("new first line\n\n" + plain.replace("text", "longer text here"));
  });

  it("hides blocks with their markers and shows a placeholder", async () => {
    const { md } = await getEncryptedBlocks(plain, encrypt);
    expect(hideEncryptBlocks(md)).toBe("# title\n\ntext\n\n\nend");
    expect(showEncryptBlocksPlaceholder(md, "P")).toBe(md.replace(/ENC\([^)]*\)/g, "P![sticker](aru/59)"));
  });

  it("needs each marker on its own line", () => {
    expect(findEncryptBlocks("a [encrypt]\nx\n[/encrypt]")).toEqual([]);
    expect(findEncryptBlocks("[encrypt]\n\n[/encrypt]")).toEqual([]);
    expect(findEncryptBlocks("no blocks")).toEqual([]);
  });
});

describe("encryptDecryptItem", () => {
  const record = (): RecordItem => ({
    id: 1, customSlug: "", time: 1, modifyTime: 1, showComments: false, encrypt: true,
    images: [], alternative: "the first 50 characters of the record"
  });
  it("encrypts and decrypts the alternative text of a record without images", async () => {
    const item = record();
    await encryptDecryptItem(item, encrypt, "/records");
    expect(item.alternative).toBe(await encrypt("the first 50 characters of the record"));
    await encryptDecryptItem(item, decrypt, "/records");
    expect(item.alternative).toBe("the first 50 characters of the record");
  });
  it("leaves a record without alternative text unchanged", async () => {
    const item = { ...record(), images: [{ src: "a.png", alt: "a" }] };
    delete item.alternative;
    await encryptDecryptItem(item, encrypt, "/records");
    expect(item.alternative).toBeUndefined();
    expect(item.images[0]!.src).toBe(await encrypt("a.png"));
  });
});
