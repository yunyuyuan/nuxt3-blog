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
    description: "p-indent"
  },
  {
    regx: "#[text](https://github.com)",
    description: "blank-link"
  },
  {
    regx: "![sticker](aru/32)",
    description: "alu-sticker"
  },
  {
    regx: "![some image description[80% x ]](https://img.com)",
    description: "image-example"
  },
  {
    regx: "-(red: some text)-",
    description: "red text"
  },
  {
    regx: "_(some text)_",
    description: "underline-text"
  },
  {
    regx: "[html][/html]",
    description: "insert-html"
  },
  {
    regx: "[youtube][description](https://xxx.com)[/youtube]",
    description: "youtube-video"
  },
  {
    regx: "[bili][description](https://xxx.com)[/bili]",
    description: "bili-video"
  },
  {
    regx: "--title--\ncontent\n-- --",
    description: "field-el"
  }
];
