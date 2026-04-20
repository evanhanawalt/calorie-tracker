import type { QueryKey } from "@tanstack/react-query";

/** Distinguishes React Query caches for browser storage vs server-backed data. */
export type TrackerStorageMode = "local" | "remote";

const trackerRoot = ["tracker"] as const;

const trackerKeySeg = {
  summary: "summary",
  calendar: "calendar",
} as const;

export const trackerQueryKeys = {
  root: trackerRoot,
  forMode: (mode: TrackerStorageMode) => [...trackerRoot, mode] as const,
  summary: (mode: TrackerStorageMode, date: string) =>
    [...trackerRoot, mode, trackerKeySeg.summary, date] as const,
  calendar: (mode: TrackerStorageMode, start: string, end: string) =>
    [...trackerRoot, mode, trackerKeySeg.calendar, start, end] as const,
};

/** Date segment for a key built with `trackerQueryKeys.summary`, if any. */
export function matchTrackerSummaryQueryKey(key: QueryKey): string | undefined {
  if (!Array.isArray(key) || key.length !== 4) return undefined;
  if (key[0] !== "tracker" || key[2] !== "summary") return undefined;
  const date = key[3];
  return typeof date === "string" ? date : undefined;
}

/** Start/end for a key built with `trackerQueryKeys.calendar`, if any. */
export function matchTrackerCalendarQueryKey(
  key: QueryKey,
): { start: string; end: string } | undefined {
  if (!Array.isArray(key) || key.length !== 5) return undefined;
  if (key[0] !== "tracker" || key[2] !== "calendar") return undefined;
  const start = key[3];
  const end = key[4];
  if (typeof start === "string" && typeof end === "string") {
    return { start, end };
  }
  return undefined;
}

export const settingsQueryKeys = {
  root: ["userSettings"] as const,
  forMode: (mode: TrackerStorageMode) => ["userSettings", mode] as const,
};

export const authQueryKeys = {
  session: ["authSession"] as const,
};

export const meQueryKeys = {
  root: ["me"] as const,
};
