import { withBase } from "#layers/nuxt3-blog/app/utils/nuxt/with-base";

export default defineNuxtPlugin((app) => {
  app.hook("vue:setup", () => {
    useSeoMeta({
      ogImage: withBase("/icon.png"),
      twitterCard: "summary"
    });
  });
});
