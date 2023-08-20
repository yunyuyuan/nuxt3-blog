export type EncryptBlock = {
  start: number;
  end: number;
}

export type NeedsItem = {
  id: number;
  time: number;
  modifyTime: number;
  encrypt: boolean;
  encryptBlocks?: EncryptBlock[] | null;
  visitors: number;
  _show: boolean;
};

export type ArticleItem = NeedsItem & {
  title: string;
  len: number;
  tags: string[];
};

export type RecordItem = NeedsItem & {
  images: { src: string; alt: string, id?: number }[];
};

export const KnowledgeTabsList = [
  { key: "book", name: "book" },
  { key: "film", name: "film" },
  { key: "game", name: "game" }
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
    name: "articles",
    url: "/articles",
    show: true
  },
  {
    name: "records",
    url: "/records",
    show: true
  },
  {
    name: "knowledges",
    url: "/knowledges",
    show: true
  }
] as const;

export type HeaderTab = typeof HeaderTabs[number];

export const HeaderTabUrls = HeaderTabs.map(tab => tab.url);
export type HeaderTabUrl = typeof HeaderTabUrls[number];
export const Order = [
  "title",
  "tags",
  "type",
  "images",
  "link",
  "cover",
  "summary"
];

export type DecryptFunction = (_s: string) => Promise<string>;
