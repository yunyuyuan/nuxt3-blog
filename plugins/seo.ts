import config from "~/config";

export default defineNuxtPlugin((app) => {
  app.hook("vue:setup", () => {
    useSeoMeta({
      ogDescription: config.SEO_description,
      ogImage: "/icon.png",
      twitterCard: "summary"
    });
  });
});
