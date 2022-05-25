import config from "./config";
import dayjs from "./utils/_dayjs";

export function escapeHtml (s) {
  return s.toString()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

class Node {
  tag: string;
  content: string;
  children = [];

  constructor (tag: string, content?) {
    this.tag = tag;
    this.content = content;
  }

  addChild (node: Node) {
    this.children.push(node);
  }

  toString () {
    if (this.children.length) {
      return `<${this.tag}>${
        this.children.map(node => node.toString()).join("\n")
      }</${this.tag}>`;
    }
    return `<${this.tag}>${escapeHtml(this.content)}</${this.tag}>`;
  }
}

export default function genRss (json) {
  const origin = config.domain;
  const startStr = "<?xml version=\"1.0\" encoding=\"UTF-8\"?><rss version=\"2.0\">";
  const endStr = "</rss>";

  const channel = new Node("channel");
  channel.addChild(new Node("title", config.title));
  channel.addChild(new Node("link", origin));
  channel.addChild(new Node("description", config.SEO_description));
  channel.addChild(new Node("language", "zh-cn"));

  for (const i of json.filter(i => !i.encrypt)) {
    const item = new Node("item");
    item.addChild(new Node("author", config.githubName));
    item.addChild(new Node("title", i.title));
    item.addChild(new Node("link", origin + "/articles/" + i.id));
    item.addChild(new Node("pubDate", dayjs.utc(i.time).toString()));
    item.addChild(new Node("guid", i.id));

    channel.addChild(item);
  }
  return `${startStr}${channel.toString()}${endStr}`;
}
