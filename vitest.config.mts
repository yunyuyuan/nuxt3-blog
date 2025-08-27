import { defineVitestConfig } from "@nuxt/test-utils/config";

export default defineVitestConfig({
  test: {
    environment: "nuxt",
    testTimeout: 25000,
    alias: [
      {
        find: /^monaco-editor$/,
        replacement:
          __dirname + "/node_modules/monaco-editor/esm/vs/editor/editor.api",
      },
    ],
  },
});
