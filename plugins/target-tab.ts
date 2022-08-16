import { HeaderTabs } from "~/utils/types";

export default defineNuxtPlugin(() => {
  const router = useRouter();
  router.beforeEach((to) => {
    const target = HeaderTabs.find(tab => to.path.includes(tab.url));
    useCurrentTab().value = target;
  });
});
