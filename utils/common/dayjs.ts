import dayjs from "dayjs";
import weekOfYear from "dayjs/plugin/weekOfYear.js";
import utc from "dayjs/plugin/utc.js";
import timezone from "dayjs/plugin/timezone";
import isToday from "dayjs/plugin/isToday.js";
import config from "../../config";

/* eslint-disable import/no-named-as-default-member */
dayjs.extend(weekOfYear);
dayjs.extend(utc);
dayjs.extend(timezone);
dayjs.extend(isToday);

export function getNowDayjs (time?: number) {
  return dayjs.tz(time, config.timezone);
}

export function getNowDayjsString (time?: number) {
  return getNowDayjs(time).toDate().toUTCString();
}

export function getNowStamp (time?: number) {
  return getNowDayjs(time).toDate().getTime();
}
