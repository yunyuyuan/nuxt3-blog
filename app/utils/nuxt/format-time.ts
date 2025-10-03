import { getLocaleByCode } from "../common/locales";
import { translate } from "~/utils/nuxt/i18n";
import { getNowDayjs } from "~/utils/common/dayjs";

export function formatTime(stamp?: number, type: "full" | "date" | "month" = "full") {
  return computed(() => {
    const { formatFull, formatDate, formatMonth } = getLocaleByCode(useI18nCode().i18nCode.value)!;
    let format = "";
    switch (type) {
      case "full":
        format = formatFull;
        break;
      case "date":
        format = formatDate;
        break;
      case "month":
        format = formatMonth;
        break;
    }
    return getNowDayjs(stamp).format(format);
  }).value;
}

export function literalTime(stamp: number) {
  const dayOld = getNowDayjs(stamp);
  const dayNew = getNowDayjs();
  const subDay = dayNew.diff(dayOld, "day");
  const subWeek = dayNew.diff(dayOld, "week");
  const subMonth = dayNew.diff(dayOld, "month");
  const subYear = dayNew.diff(dayOld, "year");
  if (dayOld.isToday()) {
    return translate("today");
  }
  if (subWeek < 1) {
    return translate("days-ago", [Math.max(1, subDay)]);
  }
  if (subMonth < 1) {
    return translate("weeks-ago", [Math.max(1, subWeek)]);
  }
  if (subYear < 1) {
    return translate("months-ago", [Math.max(1, subMonth)]);
  }
  return translate("years-ago", [Math.max(1, subYear)]);
}
