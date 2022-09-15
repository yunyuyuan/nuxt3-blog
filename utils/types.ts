export type NeedsItem = {
  id: number;
  time: number;
  modifyTime: number;
  encrypt: boolean;
  encryptBlocks?: {
    start: number;
    end: number;
  }[] | null;
  _show?: boolean;
};

export type ArticleItem = NeedsItem & {
  title: string;
  len: number;
  menu: {
    size: "big" | "small";
    text: string;
    url: string;
  }[];
  tags: string[];
};

export type RecordItem = NeedsItem & {
  images: { src: string; alt: string, id?: number }[];
};

export const KnowledgeTabsList = [
  { key: "book", name: "书籍" },
  { key: "film", name: "影视" },
  { key: "game", name: "游戏" }
] as const;
export const KnowledgeTabs = KnowledgeTabsList.map(item => item.key);
export type KnowledgeTab = typeof KnowledgeTabs[number];

export type KnowledgeItem = NeedsItem & {
  title: string;
  type: KnowledgeTab;
  link: string;
  cover: string;
  summary: string;
};

export type CommonItem = ArticleItem | RecordItem | KnowledgeItem;

export type AllKeys = (keyof ArticleItem) | (keyof RecordItem) | (keyof KnowledgeItem);

export const HeaderTabs = [
  {
    name: "文章",
    url: "/articles",
    show: true
  },
  {
    name: "记录",
    url: "/records",
    show: true
  },
  {
    name: "文化",
    url: "/knowledges",
    show: true
  }
] as const;

export type HeaderTab = typeof HeaderTabs[number];

export const HeaderTabUrls = HeaderTabs.map(tab => tab.url);
export type HeaderTabUrl = typeof HeaderTabUrls[number];
export const Translation = {
  title: "标题",
  tags: "标签",
  type: "类型",
  images: "图片",
  cover: "封面",
  link: "链接",
  summary: "简介"
};
export const Order = [
  "title",
  "tags",
  "type",
  "images",
  "link",
  "cover",
  "summary"
];
