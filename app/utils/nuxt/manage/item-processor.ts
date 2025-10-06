import { notify } from "../notify";
import { translate } from "../i18n";
import type { ArticleItem, RecordItem, KnowledgeItem, CommonItem, HeaderTabUrl } from "~/utils/common/types";
import { escapeNewLine } from "~/utils/common/utils";
import { encryptDecryptItem, getEncryptedBlocks } from "~/utils/common/process-encrypt-decrypt";
import { getNowStamp } from "~/utils/common/dayjs";
import { randomId } from "~/utils/nuxt/manage";
import { deepClone } from "~/utils/nuxt/utils";

/**
 * 根据不同类型处理item内容
 * @param md markdown内容
 * @param item 项目对象
 * @param targetTab 目标标签
 */
export function processItemContent(md: string, item: CommonItem, targetTab: HeaderTabUrl): void {
  switch (targetTab) {
    case "/articles":
      processArticleContent(md, item as ArticleItem);
      break;
    case "/records":
      processRecordContent(md, item as RecordItem);
      break;
    case "/knowledges":
      processKnowledgeContent(md, item as KnowledgeItem);
      break;
  }
}

/**
 * 处理文章内容
 */
function processArticleContent(md: string, item: ArticleItem): void {
  // 计算文章长度
  item.len = md.length;

  // 如果文章加密，清空标签
  if (item.encrypt) {
    item.tags.splice(0, item.tags.length);
  }
}

/**
 * 处理记录内容
 */
function processRecordContent(_md: string, item: RecordItem): void {
  // 清理图片对象的临时id字段
  item.images.forEach((img) => {
    delete img.id;
  });
}

/**
 * 处理知识内容
 */
function processKnowledgeContent(_md: string, _item: KnowledgeItem): void {
  // 知识类型不需要特殊处理
}

/**
 * 获取处理后的上传信息
 * @param editingItem 编辑中的项目
 * @param editingMd 编辑中的markdown内容
 * @param targetTab 目标标签
 * @param originList 原始列表
 * @param isNew 是否为新项目
 * @param encryptor 加密器
 * @param baseInfoElement 基础信息表单元素，用于验证
 * @returns 处理后的上传信息或null（如果验证失败）
 */
export async function getProcessedUploadInfo<T extends CommonItem>(params: {
  editingItem: T;
  editingMd: string;
  targetTab: HeaderTabUrl;
  originList: T[];
  isNew: boolean;
  encryptor: {
    usePasswd: { value: string };
    encrypt: (content: string) => Promise<string>;
  };
  baseInfoElement?: HTMLElement;
}): Promise<{ item: T; md: string } | null> {
  const { editingItem, editingMd, targetTab, originList, isNew, encryptor, baseInfoElement } = params;

  // 验证表单
  if (baseInfoElement) {
    const invalidInfo = baseInfoElement.querySelectorAll<HTMLElement>(".form-item-invalid");
    if (invalidInfo.length) {
      notify({
        type: "error",
        title: translate("missing-info"),
        description: translate("missing") + `: ${Array.from(invalidInfo)
          .map(el => el.innerText)
          .join(", ")}`
      });
      return null;
    }
  }

  // 克隆项目，用于上传
  const newItem = deepClone(editingItem) as T;

  // 删除内部字段
  for (const key of Object.keys(newItem)) {
    if (key.startsWith("_")) {
      // eslint-disable-next-line @typescript-eslint/no-dynamic-delete
      delete newItem[key as keyof T];
    }
  }

  let mdContent = escapeNewLine(editingMd);

  // 根据类型处理内容
  processItemContent(mdContent, newItem, targetTab);

  const needPasswd = () => {
    notify({
      type: "error",
      title: translate("need-passwd")
    });
    useShowPwdModal().value = true;
  };

  // 处理加密
  if (newItem.encrypt) {
    if (!encryptor.usePasswd.value) {
      needPasswd();
      return null; // 需要密码但未设置
    }
    await encryptDecryptItem(newItem, encryptor.encrypt, targetTab);
    mdContent = await encryptor.encrypt(mdContent);
    // 整篇加密的markdown，不会再有加密块
    delete newItem.encryptBlocks;
  } else {
    // 处理加密块
    const { md, blocks } = await getEncryptedBlocks(mdContent, encryptor.encrypt);
    mdContent = md;
    if (blocks.length) {
      newItem.encryptBlocks = blocks.reverse();
    } else {
      delete newItem.encryptBlocks;
    }
    if (newItem.encryptBlocks?.length && !encryptor.usePasswd.value) {
      needPasswd();
      return null; // 需要密码但未设置
    }
  }

  // 更新时间
  const nowTime = getNowStamp();
  if (isNew) {
    newItem.id = randomId(originList);
    newItem.time = nowTime;
  }
  newItem.modifyTime = nowTime;
  if (!newItem.time) {
    newItem.time = nowTime;
  }

  return {
    item: newItem,
    md: mdContent
  };
}
