import { expect } from "vitest";
import { nextTick } from "vue";
import type { ArticleItem } from "../../../app/utils/common/types";
import { ENCRYPTED_PREFIX } from "../../manage/fixtures";
import { ManageBasePage } from "./BasePage";

/** Page object for the manage item editor (`/manage/<tab>/<id>`). */
export class ManageItemPage extends ManageBasePage {
  // ---------------------------------------------------------------------------
  // Form editing (article fields)
  // ---------------------------------------------------------------------------

  async setTitle(title: string) {
    await this.fillInput("item-title-input", title);
  }

  async setTags(tags: string) {
    await this.fillInput("item-tags-input", tags);
    await this.waitForTimeout();
  }

  async setContent(content: string) {
    await this.clearAndTypeInMonacoEditor(content);
    await this.waitForTimeout(800);
  }

  async setCustomSlug(slug: string) {
    await this.fillInput("item-slug-input", slug);
  }

  /** Fill the common article fields; tags/content are filled only when given. */
  async fillItemDetails(title: string, tags?: string, content?: string) {
    await this.setTitle(title);
    if (tags) {
      await this.setTags(tags);
    }
    if (content) {
      await this.setContent(content);
    }
  }

  /** Flip the "encrypt whole item" checkbox unconditionally. */
  async toggleEncrypted() {
    await this.clickElement("item-encrypt-checkbox");
    await nextTick();
  }

  /** Set the "encrypt whole item" checkbox to an explicit value. */
  async setEncrypted(encrypted: boolean) {
    await this.setChecked("item-encrypt-checkbox", encrypted);
    await nextTick();
  }

  /** Set the "show comments" checkbox to an explicit value. */
  async setShowComments(show: boolean) {
    await this.setChecked("item-show-comment-checkbox", show);
  }

  // ---------------------------------------------------------------------------
  // Actions
  // ---------------------------------------------------------------------------

  async uploadItem() {
    await this.getByTestId("item-upload-btn").click();
    await this.waitForTimeout();
  }

  async deleteItem() {
    await this.getByTestId("item-delete-btn").click();
    await this.clickElement("confirm-item-delete");
    await this.waitForTimeout();
  }

  async stageItem() {
    await this.clickElement("item-stage-btn");
  }

  async loadStaged() {
    await this.clickElement("load-staged-btn");
  }

  async deleteStaged() {
    await this.clickElement("delete-staged-btn");
  }

  /** Clear the title field and the markdown body (tags stay untouched). */
  async clearTitleAndContent() {
    await this.fillInput("item-title-input", "");
    await this.clearAndTypeInMonacoEditor("");
  }

  // Staged-items commit modal (reachable from the sidebar on any manage page).
  async openCommitStagedModal() {
    await this.clickElement("commit-staged-btn");
  }

  async confirmCommitStaged() {
    await this.clickElement("staged-items-modal-ok");
  }

  /** Open the staged-items modal and confirm the commit. */
  async commitStaged() {
    await this.openCommitStagedModal();
    await this.confirmCommitStaged();
  }

  // ---------------------------------------------------------------------------
  // Commit-payload assertions
  // ---------------------------------------------------------------------------

  /** The full article list as committed to the json file. */
  getCommittedList() {
    return this.parseAddition<ArticleItem[]>(0);
  }

  /** Find the committed article matching a predicate. */
  findCommitted(predicate: (_: ArticleItem) => boolean) {
    return this.getCommittedList().find(predicate);
  }

  /**
   * Assert properties of the committed list. The list always contains *every*
   * item (edited + untouched), so the counts below reflect the whole list.
   */
  expectCommittedList(options: {
    /** Exact number of items in the committed list. */
    length?: number;
    /** A partial item that must exist (matches id/title/encrypt/first tag). */
    find?: Partial<ArticleItem>;
    /** A predicate that must match no item. */
    notFind?: (_: ArticleItem) => boolean;
    /** How many items carry encrypt blocks. */
    blockCount?: number;
    /** Whether some item still has an encrypted (ciphertext) title. */
    hasEncryptedTitle?: boolean;
  }) {
    const list = this.getCommittedList();

    if (options.length !== undefined) {
      expect(list).lengthOf(options.length);
    }

    if (options.find) {
      const { id, title, encrypt, tags } = options.find;
      const match = list.find((i) => {
        if (id !== undefined && i.id !== id) return false;
        if (title !== undefined && i.title !== title) return false;
        if (encrypt !== undefined && i.encrypt !== encrypt) return false;
        if (tags?.length && !i.tags.includes(tags[0]!)) return false;
        return true;
      });
      expect(match, `expected to find item matching ${JSON.stringify(options.find)}`).toBeDefined();
    }

    if (options.notFind) {
      expect(list.find(options.notFind)).toBeUndefined();
    }

    if (options.blockCount !== undefined) {
      expect(list.filter(i => Boolean(i.encryptBlocks?.length))).lengthOf(options.blockCount);
    }

    if (options.hasEncryptedTitle !== undefined) {
      const encryptedTitle = list.find(i => i.title.startsWith(ENCRYPTED_PREFIX));
      if (options.hasEncryptedTitle) {
        expect(encryptedTitle).toBeDefined();
      } else {
        expect(encryptedTitle).toBeUndefined();
      }
    }

    return list;
  }

  /** Assert the committed markdown contains / excludes given substrings. */
  expectCommittedContent({ contains, excludes }: { contains?: string; excludes?: string }) {
    const content = this.requestAdditions.map(r => r.content).join("\n");
    if (contains) {
      expect(content).toContain(contains);
    }
    if (excludes) {
      expect(content).not.toContain(excludes);
    }
    return content;
  }

  /** Assert the markdown file deleted by the commit ends with the given name. */
  expectDeletedFile(fileName: string) {
    const path = this.requestDeletions[0]?.path || "";
    expect(path.endsWith(fileName)).toBe(true);
    return path;
  }
}
