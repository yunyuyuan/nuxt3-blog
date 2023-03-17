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
