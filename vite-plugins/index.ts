import devImport from "./dev-import";
import imgUpload from "./img-upload";
import rebuild from "./rebuild";
import svgLoader from "./svg-loader";
import visitors from "./visitors";

export const allPlugins = [devImport, svgLoader, imgUpload, rebuild, visitors];
export const buildPlugins = [devImport, svgLoader];
