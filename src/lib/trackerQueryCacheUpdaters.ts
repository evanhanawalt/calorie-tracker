import type { QueryClient } from "@tanstack/react-query";
import type { EntryStream } from "./calorieTrackerStorage";
import { sumCalories } from "./calorieTrackerStorage";
import {
  matchTrackerCalendarQueryKey,
  matchTrackerSummaryQueryKey,
  trackerQueryKeys,
} from "./trackerQueryKeys";

import type { TrackerApiActionResult } from "./trackerApiReducer";
import type { CalendarDayWire, DailySummaryWire, TrackerEntryWire } from "./trackerWire";

function recomputeTotals(s: DailySummaryWire): DailySummaryWire {
  const consumed = sumCalories(s.meals);
  const burned = sumCalories(s.workouts);
  return { ...s, consumed, burned, netConsumed: consumed - burned };
}

function upsertEntry(
  entries: TrackerEntryWire[],
  entry: TrackerEntryWire,
): TrackerEntryWire[] {
  const next = [...entries];
  const idx = next.findIndex((e) => e.id === entry.id);
  if (idx === -1) next.push(entry);
  else next[idx] = entry;
  return next;
}

function syncCalendarsForDate(
  queryClient: QueryClient,
  date: string,
  summary: DailySummaryWire,
): void {
  const netConsumed = summary.netConsumed;
  const hasActivity = summary.meals.length > 0 || summary.workouts.length > 0;
  for (const [queryKey, data] of queryClient.getQueriesData({
    queryKey: trackerQueryKeys.root,
  })) {
    const range = matchTrackerCalendarQueryKey(queryKey);
    if (!range || !data) continue;
    const { start, end } = range;
    if (date < start || date > end) continue;
    const days = data as CalendarDayWire[];
    queryClient.setQueryData(
      queryKey,
      days.map((d) =>
        d.date === date ? { ...d, netConsumed, hasActivity } : d,
      ),
    );
  }
}

function patchCalendarDay(
  queryClient: QueryClient,
  date: string,
  patch: (d: CalendarDayWire) => CalendarDayWire,
): void {
  for (const [queryKey, data] of queryClient.getQueriesData({
    queryKey: trackerQueryKeys.root,
  })) {
    const range = matchTrackerCalendarQueryKey(queryKey);
    if (!range || !data) continue;
    const { start, end } = range;
    if (date < start || date > end) continue;
    const days = data as CalendarDayWire[];
    queryClient.setQueryData(
      queryKey,
      days.map((d) => (d.date === date ? patch(d) : d)),
    );
  }
}

function invalidateCalendarsContainingDate(
  queryClient: QueryClient,
  date: string,
): void {
  for (const [queryKey] of queryClient.getQueriesData({
    queryKey: trackerQueryKeys.root,
  })) {
    const range = matchTrackerCalendarQueryKey(queryKey);
    if (!range) continue;
    const { start, end } = range;
    if (date < start || date > end) continue;
    void queryClient.invalidateQueries({ queryKey });
  }
}

function applyMutateEntry(
  queryClient: QueryClient,
  stream: EntryStream,
  mode: "add" | "update",
  entry: TrackerEntryWire,
): void {
  const date = entry.date;
  const summaryKey = trackerQueryKeys.summary(date);
  const prev = queryClient.getQueryData<DailySummaryWire>(summaryKey);

  if (!prev) {
    void queryClient.invalidateQueries({ queryKey: summaryKey });
    if (mode === "add") {
      const netDelta = stream === "food" ? entry.calories : -entry.calories;
      patchCalendarDay(queryClient, date, (d) => ({
        ...d,
        netConsumed: d.netConsumed + netDelta,
        hasActivity: true,
      }));
    } else {
      invalidateCalendarsContainingDate(queryClient, date);
    }
    return;
  }

  const next: DailySummaryWire = recomputeTotals({
    ...prev,
    meals: stream === "food" ? upsertEntry(prev.meals, entry) : prev.meals,
    workouts:
      stream === "workout" ? upsertEntry(prev.workouts, entry) : prev.workouts,
  });
  queryClient.setQueryData(summaryKey, next);
  syncCalendarsForDate(queryClient, date, next);
}

function applyDeleteEntry(
  queryClient: QueryClient,
  stream: EntryStream,
  id: string,
): void {
  for (const [queryKey, data] of queryClient.getQueriesData({
    queryKey: trackerQueryKeys.root,
  })) {
    if (matchTrackerSummaryQueryKey(queryKey) === undefined || !data) continue;
    const summary = data as DailySummaryWire;
    const list = stream === "food" ? summary.meals : summary.workouts;
    if (!list.some((e) => e.id === id)) continue;

    const nextList = list.filter((e) => e.id !== id);
    const next: DailySummaryWire = recomputeTotals({
      ...summary,
      meals: stream === "food" ? nextList : summary.meals,
      workouts: stream === "workout" ? nextList : summary.workouts,
    });
    queryClient.setQueryData(queryKey, next);
    syncCalendarsForDate(queryClient, summary.date, next);
    return;
  }

  void queryClient.invalidateQueries({ queryKey: trackerQueryKeys.root });
}

/**
 * Keeps summary + calendar query caches aligned after a tracker API mutation.
 */
export function applyTrackerMutationResultToCaches(
  queryClient: QueryClient,
  result: TrackerApiActionResult,
): void {
  if (result.kind === "deleteEntry") {
    applyDeleteEntry(queryClient, result.stream, result.id);
    return;
  }
  applyMutateEntry(queryClient, result.stream, result.mode, result.entry);
}
