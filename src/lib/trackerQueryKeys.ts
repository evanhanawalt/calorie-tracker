import type { QueryKey } from "@tanstack/react-query";

const trackerRoot = ["tracker"] as const;

const trackerKeySeg = {
  summary: "summary",
  calendar: "calendar",
} as const;

export const trackerQueryKeys = {
  root: trackerRoot,
  summary: (date: string) => [...trackerRoot, trackerKeySeg.summary, date] as const,
  calendar: (start: string, end: string) =>
    [...trackerRoot, trackerKeySeg.calendar, start, end] as const,
};

/** Date segment for a key built with `trackerQueryKeys.summary`, if any. */
export function matchTrackerSummaryQueryKey(key: QueryKey): string | undefined {
  if (!Array.isArray(key) || key.length !== 3) return undefined;
  if (key[0] !== "tracker" || key[1] !== "summary") return undefined;
  const date = key[2];
  return typeof date === "string" ? date : undefined;
}

/** Start/end for a key built with `trackerQueryKeys.calendar`, if any. */
export function matchTrackerCalendarQueryKey(
  key: QueryKey,
): { start: string; end: string } | undefined {
  if (!Array.isArray(key) || key.length !== 4) return undefined;
  if (key[0] !== "tracker" || key[1] !== "calendar") return undefined;
  const start = key[2];
  const end = key[3];
  if (typeof start === "string" && typeof end === "string") {
    return { start, end };
  }
  return undefined;
}

export const settingsQueryKeys = {
  root: ["userSettings"] as const,
};

export const authQueryKeys = {
  session: ["authSession"] as const,
};
