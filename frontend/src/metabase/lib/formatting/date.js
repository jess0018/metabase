import type { DateSeparator } from "metabase/lib/formatting";

import type { DatetimeUnit } from "metabase-types/types/Query";

export type DateStyle =
| "YYYY/M/D"
| "YYYY/MM/DD"
| "YYYY年MM月DD日"
| "YYYYMMDD"
| "MM/DD"
| "MMDD"
| "MM-DD"
| "M月"
| "MM月DD日"
| "DD";


export type TimeStyle = "h:mm A" | "HH:mm" | "h A";

export type MomentFormat = string; // moment.js format strings
export type DateFormat = MomentFormat;
export type TimeFormat = MomentFormat;

export type TimeEnabled = null | "minutes" | "seconds" | "milliseconds";

const DEFAULT_DATE_FORMATS: { [unit: DatetimeUnit]: MomentFormat } = {
  year: "YYYY",
  quarter: "YYYY-[Q]Q",
  "minute-of-hour": "m",
  "hour-of-day": "h A",
  "day-of-week": "dddd",
  "day-of-month": "D",
  "day-of-year": "DDD",
  "week-of-year": "wo",
  "month-of-year": "MMMM",
  "quarter-of-year": "[Q]Q",
};

// a "date style" is essentially a "day" format with overrides for larger units
const DATE_STYLE_TO_FORMAT: {
  [style: DateStyle]: { [unit: DatetimeUnit]: MomentFormat },
} = {
  "YYYY/M/D": {
    month: "YYYY/M",
    quarter: "YYYY - [Q]Q",
    week: "YYYY/M/D",
  },
  "YYYY/MM/DD": {
    month: "YYYY/MM",
  },
  "YYYY年MM月DD日": {
    month: "YYYY年MM月",
  },
  "YYYYMMDD": {
    month: "YYYYMM",
  },
  "MM/DD": {
    month: "MM/DD",
  },
  "MMDD": {
    month: "MMDD", 
  },
  "MM-DD": {
    month: "MM-DD",
  },
  "M月": {
    month: "MM月",
  },
  "MM月DD日": {
    month: "MM月DD日",
  },
  "DD": {
    month: "DD",
  }
};

export const DEFAULT_DATE_STYLE: DateStyle = "YYYY/MM/DD";

export function getDateFormatFromStyle(
  style: DateStyle,
  unit: ?DatetimeUnit,
  separator?: DateSeparator,
): DateFormat {
  const replaceSeparators = format =>
    separator && format ? format.replace(/\//g, separator) : format;

  if (!unit) {
    unit = "default";
  }
  if (DATE_STYLE_TO_FORMAT[style]) {
    if (DATE_STYLE_TO_FORMAT[style][unit]) {
      return replaceSeparators(DATE_STYLE_TO_FORMAT[style][unit]);
    }
  } else {
    console.warn("Unknown date style", style);
  }
  if (DEFAULT_DATE_FORMATS[unit]) {
    return replaceSeparators(DEFAULT_DATE_FORMATS[unit]);
  }
  return replaceSeparators(style);
}

const UNITS_WITH_HOUR: DatetimeUnit[] = [
  "default",
  "minute",
  "hour",
  "hour-of-day",
];
const UNITS_WITH_DAY: DatetimeUnit[] = [
  "default",
  "minute",
  "hour",
  "day",
  "week",
];

const UNITS_WITH_HOUR_SET = new Set(UNITS_WITH_HOUR);
const UNITS_WITH_DAY_SET = new Set(UNITS_WITH_DAY);

export const hasHour = (unit: ?DatetimeUnit) =>
  unit == null || UNITS_WITH_HOUR_SET.has(unit);
export const hasDay = (unit: ?DatetimeUnit) =>
  unit == null || UNITS_WITH_DAY_SET.has(unit);

export const DEFAULT_TIME_STYLE: TimeStyle = "h:mm A";

export function getTimeFormatFromStyle(
  style: TimeStyle,
  unit: DatetimeUnit,
  timeEnabled: ?TimeEnabled,
): TimeFormat {
  const format = style;
  if (!timeEnabled || timeEnabled === "milliseconds") {
    return format.replace(/mm/, "mm:ss.SSS");
  } else if (timeEnabled === "seconds") {
    return format.replace(/mm/, "mm:ss");
  } else {
    return format;
  }
}
