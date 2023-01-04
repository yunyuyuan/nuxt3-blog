import config from "~/config";
import ThemeBackgroundImage from "~/assets/image/outerwilds.jpg";

export const SvgContainerId = "_SVG_SPRITE_CONTAINER_";
export const NotificationContainerId = "_NOTIFICATION_CONTAINER_";
export const ModalContainerId = "_MODAL_CONTAINER_";
export const ViewerAttr = "data-viewer";
export const GithubTokenKey = "github-token";

export const githubRepoUrl = `https://github.com/${config.githubName}/${config.githubRepo}`;

export const inBrowser = process.client;
export const isPrerender = process.env.NODE_ENV === "prerender";
export const isDev = process.env.NODE_ENV === "development";

export const themeBackground = ThemeBackgroundImage;

export const markdownTips: {
  regx: string;
  description: string;
}[] = [
  {
    regx: "<<>>",
    description: "段落缩进"
  },
  {
    regx: "#[text](https://github.com)",
    description: "target=_blank的链接"
  },
  {
    regx: "![sticker](aru/32)",
    description: "阿鲁第32号表情"
  },
  {
    regx: "![我是描述[80% x ]](https://img.com)",
    description: "宽度80%高度未设的图片"
  },
  {
    regx: "-(red: 文字)-",
    description: "红色的文字"
  },
  {
    regx: "_(文字)_",
    description: "带下划线的文字"
  },
  {
    regx: "[html][/html]",
    description: "直接插入HTML"
  },
  {
    regx: "[youtube][描述](https://xxx.com)[/youtube]",
    description: "youtube视频"
  },
  {
    regx: "[bili][描述](https://xxx.com)[/bili]",
    description: "bilibili视频"
  },
  {
    regx: "--标题--\n内容\n-- --",
    description: "field元素"
  }
];
