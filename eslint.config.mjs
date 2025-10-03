import pluginVue from "eslint-plugin-vue";
import tailwind from "eslint-plugin-tailwindcss";
import eslint from "@eslint/js";
import tseslint from "typescript-eslint";
import withNuxt from "./.nuxt/eslint.config.mjs";

export default withNuxt(
  eslint.configs.recommended,
  tseslint.configs.recommended,
  ...pluginVue.configs["flat/recommended"],
  ...tailwind.configs["flat/recommended"],
  {
    files: ["**/*.ts", "**/*.tsx", "**/*.vue"],
    rules: {
      "quotes": ["error", "double"],
      "semi": ["error", "always"],
      "prefer-promise-reject-errors": "off",
      "no-multi-spaces": ["error"],
      "no-undef": "off",
      "no-unused-vars": "off",
      "@typescript-eslint/no-unused-vars": ["error"],
      "@typescript-eslint/no-var-requires": "off",
      "@typescript-eslint/no-explicit-any": "off",
      "@typescript-eslint/no-non-null-assertion": "off",
      "typescript-config/strict": "off",
      "vue/multi-word-component-names": "off",
      "vue/no-multiple-template-root": "off",
      "vue/no-v-model-argument": "off",
      "vue/no-v-html": "off"
    }
  }
);
