import { BookOpen, Film, Gamepad2 } from "lucide-vue-next";
import type { FunctionalComponent } from "vue";

export type EncryptBlock = {
  start: number;
  end: number;
};

export type ItemBase<T> = T & {
  id: number;
  time: number;
  modifyTime: number;
  encrypt: boolean;
  encryptBlocks?: EncryptBlock[];
  showComments: boolean;
  _visitors?: number;
  _show?: boolean;
};

export type ArticleItem = ItemBase<{
  title: string;
  len: number;
  tags: string[];
}>;

export type RecordItem = ItemBase<{
  images: { src: string; alt: string; id?: number }[];
}>;

export const KnowledgeTabsList = [
  { key: "book", name: "book" },
  { key: "film", name: "film" },
  { key: "game", name: "game" }
] as const;
export const KnowledgeTabs = KnowledgeTabsList.map(item => item.key);
export type KnowledgeTab = typeof KnowledgeTabs[number];

export type KnowledgeItem = ItemBase<{
  title: string;
  type: KnowledgeTab;
  link: string;
  cover: string;
  summary: string;
}>;

export const KnowledgeIconMap = {
  game: Gamepad2,
  film: Film,
  book: BookOpen
} as Record<KnowledgeTab, FunctionalComponent>;

export const KnowledgeColorMap = {
  game: "bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-300",
  film: "bg-rose-100 text-rose-500 dark:bg-rose-900/30 dark:text-rose-400",
  book: "bg-purple-100 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300"
} as Record<KnowledgeTab, string>;

export type CommonItem = ArticleItem | RecordItem | KnowledgeItem;

export const HeaderTabs = [
  {
    name: "articles",
    url: "/articles"
  },
  {
    name: "records",
    url: "/records"
  },
  {
    name: "knowledges",
    url: "/knowledges"
  }
] as const;

export type HeaderTabUrl = typeof HeaderTabs[number]["url"];

export type DecryptFunction = (_s: string) => Promise<string>;

export type CommitParamsAddition = { path: string; content: string };
export type CommitParamsDeletion = { path: string };

export type CommitParams = {
  additions?: CommitParamsAddition[];
  deletions?: CommitParamsDeletion[];
};

export type AlgoliaBody = {
  title: string;
  content: string;
  metaData: string;
};
