export default defineNuxtPlugin((app) => {
  app.hook("vue:setup", () => {
    useSeoMeta({
      ogImage: "/icon.png",
      twitterCard: "summary"
    });
  });
});
