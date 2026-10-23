import { describe, expect, it } from "vitest";
import { decryptEncryptBlocks, findEncryptBlocks, getEncryptedBlocks, hideEncryptBlocks, showEncryptBlocksPlaceholder } from "./process-encrypt-decrypt";

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
