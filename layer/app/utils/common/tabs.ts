// 栏目和 knowledge 类型的常量。不导入任何组件，Node 侧的脚本和构建模块也可以使用。

export const HeaderTabs = [
  "/articles",
  "/records",
  "/knowledges"
] as const;

export type HeaderTabUrl = typeof HeaderTabs[number];

export const KnowledgeTabsList = [
  { key: "book", name: "book" },
  { key: "film", name: "film" },
  { key: "game", name: "game" }
] as const;

export const KnowledgeTabs = KnowledgeTabsList.map(item => item.key);

export type KnowledgeTab = typeof KnowledgeTabs[number];
