import { HeaderTabs } from "~/utils/types";

export default defineNuxtPlugin(() => {
  const router = useRouter();
  const currentTab = useCurrentTab();
  router.beforeEach((to) => {
    const target = HeaderTabs.find(tab => to.path.includes(tab.url));
    currentTab.value = target;
  });
});
