"use client";

import {
  useCalendarDaysQuery,
  useDailySummaryQuery,
  useTrackerMutation,
  useUserSettingsQuery,
} from "@/hooks/trackerRemote";

export function useTrackerQueries(
  selectedSummaryDate: string,
  calendarStart: string,
  calendarEnd: string,
) {
  const summaryQuery = useDailySummaryQuery(selectedSummaryDate, true);
  const settingsQuery = useUserSettingsQuery(true);
  const calendarQuery = useCalendarDaysQuery(calendarStart, calendarEnd, true);
  const trackerMut = useTrackerMutation();

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
