import { HeaderTab } from "~/utils/types";

export const useCurrentTab = () => useState<HeaderTab>("currentListPending", () => null);
