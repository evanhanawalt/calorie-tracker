import { newLocalEntryId, normalizeStoredTrackerEntries } from "./trackerEntryNormalize";
import type { TrackerEntryWire } from "./trackerWire";

export const FOOD_STORAGE_KEY = "calorie_tracker_food_entries";
export const WORKOUT_STORAGE_KEY = "calorie_tracker_workout_entries";
export const BMR_STORAGE_KEY = "calorie_tracker_bmr";

/** Default basal metabolic rate (kcal/day); overridden via menu → localStorage. */
export const DEFAULT_BMR = 2000;

export type Entry = TrackerEntryWire;

/** Today's calendar date in the user's local timezone (yyyy-mm-dd). */
export function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function safeParseArray(jsonValue: string | null): unknown[] {
  try {
    const parsed = JSON.parse(jsonValue || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function loadFoodEntries(): Entry[] {
  return normalizeStoredTrackerEntries(
    safeParseArray(localStorage.getItem(FOOD_STORAGE_KEY)),
  );
}

export function loadWorkoutEntries(): Entry[] {
  return normalizeStoredTrackerEntries(
    safeParseArray(localStorage.getItem(WORKOUT_STORAGE_KEY)),
  );
}

function saveEntries(food: Entry[], workouts: Entry[]): void {
  localStorage.setItem(FOOD_STORAGE_KEY, JSON.stringify(food));
  localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(workouts));
}

export function loadBmr(): number {
  const raw = localStorage.getItem(BMR_STORAGE_KEY);
  if (raw === null) return DEFAULT_BMR;
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return DEFAULT_BMR;
  return Math.round(n);
}

export function saveBmr(kcal: number): void {
  const rounded = Math.round(kcal);
  if (!Number.isFinite(rounded) || rounded <= 0) return;
  localStorage.setItem(BMR_STORAGE_KEY, String(rounded));
}

/** True if the user has any meal or workout rows saved locally (used for migration prompt). */
export function hasMeaningfulLocalTrackerData(): boolean {
  return loadFoodEntries().length > 0 || loadWorkoutEntries().length > 0;
}

/** Clears all tracker keys from localStorage (after cloud migration). */
export function clearAllTrackerLocalStorage(): void {
  localStorage.removeItem(FOOD_STORAGE_KEY);
  localStorage.removeItem(WORKOUT_STORAGE_KEY);
  localStorage.removeItem(BMR_STORAGE_KEY);
}

/** Three-way bucket for the net-vs-BMR label (Under / On Target / Over). */
export type NetVsBmrState = "under" | "onTarget" | "over";

/**
 * Descriptor for one horizontal band of the net-vs-BMR palette. Fields
 * cover every visual need across the app (heatmap cell, hero badge,
 * legend swatches/gradient) so callers never have to re-derive the band
 * from the delta themselves.
 */
export type NetVsBmrBand = {
  /** Three-way coarse state the band belongs to. */
  readonly state: NetVsBmrState;
  /** Fill color for heatmap cells and the hero badge background. */
  readonly color: string;
  /** Foreground color that stays legible on top of `color`. */
  readonly textColor: string;
  /** Human-readable description for tooltips / screen readers. */
  readonly label: string;
  /**
   * Inclusive lower bound of `(netConsumed - bmr)` that this band
   * covers. The band applies whenever `delta >= minDelta` and no
   * higher-ranked band already matched. Use `-Infinity` for the
   * catch-all bottom band.
   */
  readonly minDelta: number;
};

/**
 * All five net-vs-BMR bands, ordered from most-over to most-under.
 *
 * Boundaries use `>=` consistently: at exactly +100 the user is
 * `"over"` (orange), at exactly -100 they are `"onTarget"` (yellow), at
 * exactly -200 they are still `"under"` (lime-green), etc. Keep this
 * list as the single source of truth for palette, thresholds, and
 * labels — the heatmap, hero badge, legend gradient and legend
 * tooltips all derive from it.
 */
export const NET_VS_BMR_BANDS: readonly NetVsBmrBand[] = [
  {
    state: "over",
    color: "#e51f1f",
    textColor: "var(--color-cream)",
    label: "Over 200 kcal above BMR",
    minDelta: 200,
  },
  {
    state: "over",
    color: "#f2a134",
    textColor: "var(--color-ink)",
    label: "100–200 kcal above BMR",
    minDelta: 100,
  },
  {
    state: "onTarget",
    color: "#f7e379",
    textColor: "var(--color-ink)",
    label: "Within ±100 kcal of BMR",
    minDelta: -100,
  },
  {
    state: "under",
    color: "#bbdb44",
    textColor: "var(--color-ink)",
    label: "100–200 kcal below BMR",
    minDelta: -200,
  },
  {
    state: "under",
    color: "#44ce1b",
    textColor: "var(--color-ink)",
    label: "Over 200 kcal below BMR (net intake)",
    minDelta: -Infinity,
  },
] as const;

/**
 * Classify `(netConsumed - bmrKcal)` into its palette band. The band
 * exposes everything the UI needs: `state` ("under" / "onTarget" /
 * "over"), `color` (cell + badge background), `textColor` (legible
 * foreground), and `label` (tooltip/aria text).
 */
export function netVsBmrBand(
  netConsumed: number,
  bmrKcal: number,
): NetVsBmrBand {
  const delta = netConsumed - bmrKcal;
  for (const band of NET_VS_BMR_BANDS) {
    if (delta >= band.minDelta) return band;
  }
  return NET_VS_BMR_BANDS[NET_VS_BMR_BANDS.length - 1];
}

/**
 * Legend swatches rendered under the heatmap, ordered from
 * most-under-BMR on the left to most-over-BMR on the right so the
 * gradient reads naturally.
 */
export const CONTRIBUTION_LEGEND_BANDS: readonly NetVsBmrBand[] = [
  ...NET_VS_BMR_BANDS,
].reverse();

export type TrackerState = {
  foodEntries: Entry[];
  workoutEntries: Entry[];
};

/** Which parallel entry list a mutation targets (meals vs workouts). */
export type EntryStream = "food" | "workout";

export function getInitialTrackerState(): TrackerState {
  return {
    foodEntries: loadFoodEntries(),
    workoutEntries: loadWorkoutEntries(),
  };
}

export type TrackerAction =
  | { type: "addEntry"; stream: EntryStream; date: string; calories: number }
  | {
      type: "updateEntryCalories";
      stream: EntryStream;
      id: string;
      calories: number;
    }
  | { type: "deleteEntry"; stream: EntryStream; id: string };

function persistStreamEntries(
  state: TrackerState,
  stream: EntryStream,
  nextForStream: Entry[],
): TrackerState {
  if (stream === "food") {
    saveEntries(nextForStream, state.workoutEntries);
    return { ...state, foodEntries: nextForStream };
  }
  saveEntries(state.foodEntries, nextForStream);
  return { ...state, workoutEntries: nextForStream };
}

function entriesForStream(state: TrackerState, stream: EntryStream): Entry[] {
  return stream === "food" ? state.foodEntries : state.workoutEntries;
}

/**
 * Applies mutations and persists to `localStorage` on every transition.
 */
export function trackerReducer(
  state: TrackerState,
  action: TrackerAction,
): TrackerState {
  switch (action.type) {
    case "addEntry": {
      const list = entriesForStream(state, action.stream);
      const nextDisplayOrder = getNextDisplayOrder(list, action.date);
      const nextForStream = [
        ...list,
        {
          id: newLocalEntryId(),
          date: action.date,
          calories: Math.max(0, Math.round(action.calories)),
          displayOrder: nextDisplayOrder,
        },
      ];
      return persistStreamEntries(state, action.stream, nextForStream);
    }
    case "updateEntryCalories": {
      const roundCal = Math.max(0, Math.round(action.calories));
      const list = entriesForStream(state, action.stream);
      const nextForStream = list.map((e) =>
        e.id === action.id ? { ...e, calories: roundCal } : e,
      );
      return persistStreamEntries(state, action.stream, nextForStream);
    }
    case "deleteEntry": {
      const list = entriesForStream(state, action.stream);
      const nextForStream = list.filter((e) => e.id !== action.id);
      return persistStreamEntries(state, action.stream, nextForStream);
    }
  }
}

export function getNextDisplayOrder(entries: Entry[], date: string): number {
  const dayEntries = entries.filter((entry) => entry.date === date);
  if (dayEntries.length === 0) return 1;
  return Math.max(...dayEntries.map((entry) => entry.displayOrder)) + 1;
}

export function sumCalories(entries: Entry[]): number {
  return entries.reduce((acc, entry) => acc + entry.calories, 0);
}

/** Sort entries for display (stable order within a day). */
export function sortEntriesForDay(entries: Entry[]): Entry[] {
  return entries.slice().sort((a, b) => {
    if (a.displayOrder !== b.displayOrder) {
      return a.displayOrder - b.displayOrder;
    }
    return a.id.localeCompare(b.id);
  });
}

export function groupedByDate(entries: Entry[]): Record<string, Entry[]> {
  const groups: Record<string, Entry[]> = {};
  for (const entry of entries) {
    if (!groups[entry.date]) {
      groups[entry.date] = [];
    }
    groups[entry.date].push(entry);
  }
  for (const k of Object.keys(groups)) {
    groups[k] = sortEntriesForDay(groups[k]);
  }
  return groups;
}

export type DailyTrackerDerivations = {
  allDates: string[];
  foodByDate: Record<string, Entry[]>;
  workoutsByDate: Record<string, Entry[]>;
  meals: Entry[];
  workouts: Entry[];
  consumed: number;
  burned: number;
  netConsumed: number;
};

/** Sorted day lists, per-date groups, and totals for the selected summary date. */
export function getDailyTrackerDerivations(
  foodEntries: Entry[],
  workoutEntries: Entry[],
  summaryDate: string,
): DailyTrackerDerivations {
  const foodByDate = groupedByDate(foodEntries);
  const workoutsByDate = groupedByDate(workoutEntries);
  const allDates = Array.from(
    new Set([...Object.keys(foodByDate), ...Object.keys(workoutsByDate)]),
  ).sort((a, b) => b.localeCompare(a));
  const meals = foodByDate[summaryDate] ?? [];
  const workouts = workoutsByDate[summaryDate] ?? [];
  const consumed = sumCalories(meals);
  const burned = sumCalories(workouts);
  return {
    allDates,
    foodByDate,
    workoutsByDate,
    meals,
    workouts,
    consumed,
    burned,
    netConsumed: consumed - burned,
  };
}

/** @param isoDate yyyy-mm-dd */
export function formatDateForDisplay(isoDate: string): string {
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return isoDate;
  }
  const [y, m, d] = parts;
  const local = new Date(y, m - 1, d);
  return local.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}
