import devImport from "./dev-import";
import imgUpload from "./img-upload";
import rebuild from "./rebuild";
import visitors from "./visitors";

export const allPlugins = [devImport, imgUpload, rebuild, visitors];
export const buildPlugins = [devImport];
