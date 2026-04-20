"use client";

import {
  useCalendarDaysQuery,
  useDailySummaryQuery,
  useTrackerMutation,
  useUserSettingsQuery,
} from "@/hooks/trackerRemote";
import type { TrackerStorageMode } from "@/lib/trackerQueryKeys";

export function useTrackerQueries(
  storageMode: TrackerStorageMode,
  selectedSummaryDate: string,
  calendarStart: string,
  calendarEnd: string,
) {
  const summaryQuery = useDailySummaryQuery(
    storageMode,
    selectedSummaryDate,
    true,
  );
  const settingsQuery = useUserSettingsQuery(storageMode, true);
  const calendarQuery = useCalendarDaysQuery(
    storageMode,
    calendarStart,
    calendarEnd,
    true,
  );
  const trackerMut = useTrackerMutation(storageMode);

  const derivedSummaryError = summaryQuery.isError
    ? summaryQuery.error instanceof Error
      ? summaryQuery.error.message
      : "Could not load day summary."
    : "";

  return {
    summaryQuery,
    settingsQuery,
    calendarQuery,
    trackerMut,
    derivedSummaryError,
  };
}
