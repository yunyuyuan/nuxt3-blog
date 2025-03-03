import { expect } from "vitest";
import { ManageBasePage } from "./BasePage";
import type { ArticleItem } from "~/utils/common/types";

export class ManageItemPage extends ManageBasePage {
  async fillItemDetails(title: string, tags?: string, content?: string) {
    await this.fillInput("item-title-input", title);

    if (tags) {
      await this.fillInput("item-tags-input", tags);
      await this.waitForTimeout();
    }

    if (content) {
      await this.clearAndTypeInMonacoEditor(content);
      await this.waitForTimeout(800);
    }
  }

  async toggleEncrypted() {
    await this.clickElement("item-encrypt-checkbox");
    await nextTick();
  }

  async uploadItem() {
    const uploadBtn = await this.getByTestId("item-upload-btn");
    await uploadBtn.click();
    await this.waitForTimeout();
  }

  async deleteItem() {
    const deleteBtn = await this.getByTestId("item-delete-btn");
    await deleteBtn.click();
    await this.clickElement("confirm-item-delete");
    await this.waitForTimeout();
  }

  async verifyItemListInResponse(options: {
    expectedLength?: number;
    shouldFindItem?: Partial<ArticleItem>;
    shouldNotFindItem?: (_: ArticleItem) => boolean;
    encryptBlocksItemsCount?: number;
    shouldContainEncryptedTitle?: boolean;
  }) {
    const requestList = JSON.parse(this.requestAdditions[0].content || "") as ArticleItem[];

    if (options.expectedLength !== undefined) {
      expect(requestList).lengthOf(options.expectedLength);
    }

    if (options.shouldFindItem) {
      const item = options.shouldFindItem;
      const matchingItem = requestList.find((i) => {
        let matches = true;
        if (item?.id !== undefined) matches = matches && i.id === item.id;
        if (item?.title !== undefined) matches = matches && i.title === item.title;
        if (item?.encrypt !== undefined) matches = matches && i.encrypt === item.encrypt;
        if (item?.tags !== undefined && item.tags.length > 0) {
          const tag = item.tags[0];
          matches = matches && !!i.tags.find(t => t === tag);
        }
        return matches;
      });
      expect(matchingItem).toBeDefined();
    }

    if (options.shouldNotFindItem !== undefined) {
      expect(requestList.find(options.shouldNotFindItem)).toBeUndefined();
    }

    if (options.encryptBlocksItemsCount !== undefined) {
      expect(requestList.filter(i => Boolean(i.encryptBlocks?.length))).lengthOf(options.encryptBlocksItemsCount);
    }

    const foundEncryptedTitle = requestList.find(i => i.title === "U2FsdGVkX18wyEu7vCLMOGilOsG2cQdWY+kvi3b+AZE=");
    if (options.shouldContainEncryptedTitle) {
      expect(foundEncryptedTitle).toBeDefined();
    } else {
      expect(foundEncryptedTitle).toBeUndefined();
    }

    return requestList;
  }

  async verifyItemContentInResponse(shouldContain?: string, shouldNotContain?: string) {
    const newItemContent = this.requestAdditions[1].content || "";

    if (shouldContain) {
      expect(newItemContent).toContain(shouldContain);
    }

    if (shouldNotContain) {
      expect(newItemContent).not.toContain(shouldNotContain);
    }

    return newItemContent;
  }

  async verifyDeletionPathInResponse(shouldContain: string) {
    const deletionItem = this.requestDeletions[0].path || "";
    expect(deletionItem).toContain(shouldContain);
    return deletionItem;
  }
}
