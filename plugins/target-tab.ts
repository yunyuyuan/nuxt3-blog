import { Ref } from "vue";
import { CommonItem, HeaderTab, HeaderTabs } from "~/utils/types";
import { timeStamp } from "~/utils/constants";

export type TargetTab = {targetTab: HeaderTab, pending?: Ref<boolean>, list?: Ref<CommonItem[]>};

export default defineNuxtPlugin(() => {
  return {
    provide: {
      targetTab: computed(() => {
        const path = useRoute().path;
        const target = HeaderTabs.find(tab => path.includes(tab.url));
        if (target) {
          const { pending, data } = useFetch(`/rebuild/json${target.url}.json?s=${timeStamp}`);
          return {
            targetTab: target, pending, list: data as Ref<CommonItem[]>
          };
        } else {
          return {
            targetTab: target
          };
        }
      })
    }
  };
});
