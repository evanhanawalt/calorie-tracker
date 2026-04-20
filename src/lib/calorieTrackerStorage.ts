import { newLocalEntryId, normalizeStoredTrackerEntries } from "./trackerEntryNormalize";
import type { TrackerEntryWire } from "./trackerWire";

export const FOOD_STORAGE_KEY = "calorie_tracker_food_entries";
export const WORKOUT_STORAGE_KEY = "calorie_tracker_workout_entries";
export const BMR_STORAGE_KEY = "calorie_tracker_bmr";

/** Default basal metabolic rate (kcal/day); overridden via menu → localStorage. */
export const DEFAULT_BMR = 2000;

export type Entry = TrackerEntryWire;

export { normalizeStoredTrackerEntries };

/** Today's calendar date in the user's local timezone (yyyy-mm-dd). */
export function getLocalTodayIso(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function safeParseArray(jsonValue: string | null): unknown[] {
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

export function saveEntries(food: Entry[], workouts: Entry[]): void {
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

/** Net intake for a day: meals minus workouts (same as summary “Net”). */
export function netCaloriesForDate(
  foodByDate: Record<string, Entry[]>,
  workoutsByDate: Record<string, Entry[]>,
  iso: string,
): number {
  const consumed = sumCalories(foodByDate[iso] ?? []);
  const burned = sumCalories(workoutsByDate[iso] ?? []);
  return consumed - burned;
}

/**
 * Fill color for a day with activity, from net calories vs BMR.
 * Green when net is under BMR → red when over BMR (five bands).
 */
export function contributionColorForNetVsBmr(
  netConsumed: number,
  bmr: number,
): string {
  const d = netConsumed - bmr;
  if (d > 200) return "#e51f1f";
  if (d > 100) return "#f2a134";
  if (d >= -100) return "#f7e379";
  if (d >= -200) return "#bbdb44";
  return "#44ce1b";
}

export type ContributionLegendBand = {
  readonly color: string;
  readonly label: string;
};

/** Legend order: most under BMR (green) → most over BMR (red). Matches `contributionColorForNetVsBmr`. */
export const CONTRIBUTION_LEGEND_BANDS: readonly ContributionLegendBand[] = [
  { color: "#44ce1b", label: "Over 200 kcal below BMR (net intake)" },
  { color: "#bbdb44", label: "100–200 kcal below BMR" },
  { color: "#f7e379", label: "Within ±100 kcal of BMR" },
  { color: "#f2a134", label: "100–200 kcal above BMR" },
  { color: "#e51f1f", label: "Over 200 kcal above BMR" },
] as const;

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

export function entryItemLabel(
  type: "food" | "workout",
  /** 1-based label index for the day after sorting by `displayOrder`. */
  displayIndex: number,
  entry: Pick<Entry, "calories">,
): string {
  if (type === "food") {
    return `Meal ${displayIndex}: ${entry.calories} cal`;
  }
  return `Workout ${displayIndex}: ${entry.calories} cal`;
}

/** @param isoDate yyyy-mm-dd */
export function formatDateForDisplay(isoDate: string): string {
  const parts = isoDate.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return isoDate;
  }
  const [y, m, d] = parts;
  const local = new Date(y, m - 1, d);
  let label = local.toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
  if (isoDate === getLocalTodayIso()) {
    label += " (today)";
  }
  return label;
}
