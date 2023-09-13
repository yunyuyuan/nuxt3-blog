import { ArticleItem, getNowDayjsString, escapeHtml } from "../../utils/common";
import config from "../../config";

// eslint-disable-next-line @typescript-eslint/no-empty-interface
interface INode {
  addChild (_: INode): void;
  toString(): string;
}

class Node implements INode {
  tag: string;
  content?: string;
  children: INode[] = [];

  constructor (tag: string, content?: string) {
    this.tag = tag;
    this.content = content;
  }

  addChild (node: INode) {
    this.children.push(node);
  }

  toString () {
    if (this.children.length) {
      return `<${this.tag}>${
        this.children.map(node => node.toString()).join("\n")
      }</${this.tag}>`;
    }
    return `<${this.tag}>${escapeHtml(this.content || "")}</${this.tag}>`;
  }
}

export function genRss (json: ArticleItem[]) {
  const origin = config.domain;
  const startStr = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\">";
  const endStr = "</rss>";

  const channel = new Node("channel");
  channel.addChild(new Node("title", config.title));
  channel.addChild(new Node("link", origin));
  channel.addChild(new Node("language", config.defaultLang));

  for (const i of json.filter(i => !i.encrypt)) {
    const item = new Node("item");
    item.addChild(new Node("author", config.githubName));
    item.addChild(new Node("title", i.title));
    item.addChild(new Node("link", origin + "/articles/" + i.id));
    item.addChild(new Node("pubDate", getNowDayjsString(i.time)));
    item.addChild(new Node("guid", String(i.id)));

    channel.addChild(item);
  }
  return `${startStr}${channel.toString()}${endStr}`;
}
