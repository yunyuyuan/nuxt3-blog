import devImport from "./dev-import";
import rebuild from "./rebuild";
import svgLoader from "./svg-loader";

export const allPlugins = [devImport, svgLoader, rebuild];
export const buildPlugins = [devImport, svgLoader];
