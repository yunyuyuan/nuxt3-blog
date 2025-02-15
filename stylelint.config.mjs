/** @type {import('stylelint').Config} */
export default {
  extends: ["stylelint-config-standard", "stylelint-config-standard-scss", "stylelint-config-recommended-vue/scss"],
  rules: {
    "selector-class-pattern": null,
    "selector-id-pattern": null,
    "no-descending-specificity": null,
    "declaration-property-value-no-unknown": null
  }
};