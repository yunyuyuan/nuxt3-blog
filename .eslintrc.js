module.exports = {
  env: {
    browser: true,
    es2021: true,
    node: true
  },
  extends: [
    "eslint:recommended",
    "plugin:vue/vue3-recommended",
    "plugin:@typescript-eslint/recommended",
    "@nuxtjs/eslint-config-typescript"
  ],
  parserOptions: {
    ecmaVersion: "latest",
    parser: "@typescript-eslint/parser",
    sourceType: "module"
  },
  plugins: ["vue", "@typescript-eslint"],
  rules: {
    quotes: ["error", "double"],
    semi: ["error", "always"],
    indent: ["error", 2, { SwitchCase: 1 }],
    "no-multi-spaces": ["error"],
    "no-unused-vars": [
      "error",
      {
        vars: "all",
        args: "after-used",
        ignoreRestSiblings: false,
        argsIgnorePattern: "^_"
      }
    ],
    "@typescript-eslint/no-var-requires": "off",
    "vue/no-multiple-template-root": "off",
    "vue/no-v-model-argument": "off",
    "vue/no-v-html": "off"
  }
};
