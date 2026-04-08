export const FOOD_STORAGE_KEY = "calorie_tracker_food_entries";
export const WORKOUT_STORAGE_KEY = "calorie_tracker_workout_entries";
export const BMR_STORAGE_KEY = "calorie_tracker_bmr";

/** Default basal metabolic rate (kcal/day); overridden via menu → localStorage. */
export const DEFAULT_BMR = 2000;

export type Entry = { date: string; calories: number; count: number };

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

export function sanitizeEntries(entries: unknown[]): Entry[] {
  return entries
    .filter((entry): entry is Entry => {
      return (
        !!entry &&
        typeof entry === "object" &&
        typeof (entry as Entry).date === "string" &&
        typeof (entry as Entry).calories === "number" &&
        Number.isFinite((entry as Entry).calories) &&
        typeof (entry as Entry).count === "number" &&
        Number.isInteger((entry as Entry).count) &&
        (entry as Entry).count > 0
      );
    })
    .map((entry) => ({
      date: entry.date,
      calories: Math.max(0, Math.round(entry.calories)),
      count: entry.count,
    }));
}

export function loadFoodEntries(): Entry[] {
  return sanitizeEntries(
    safeParseArray(localStorage.getItem(FOOD_STORAGE_KEY)),
  );
}

export function loadWorkoutEntries(): Entry[] {
  return sanitizeEntries(
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
 * Bands: large surplus → red; moderate surplus; near maintenance; moderate deficit; large deficit → blue-violet.
 */
export function contributionColorForNetVsBmr(net: number, bmr: number): string {
  const d = net - bmr;
  if (d > 150) return "#FF0000";
  if (d > 50) return "#CC0033";
  if (d >= -50) return "#990066";
  if (d >= -150) return "#660099";
  return "#3300CC";
}

export type ContributionLegendBand = {
  readonly color: string;
  readonly label: string;
};

/** Legend order: largest deficit vs BMR → largest surplus. Matches `contributionColorForNetVsBmr`. */
export const CONTRIBUTION_LEGEND_BANDS: readonly ContributionLegendBand[] = [
  { color: "#3300CC", label: "Over 150 below BMR" },
  { color: "#660099", label: "50–150 below BMR" },
  { color: "#990066", label: "Within ±50 of BMR" },
  { color: "#CC0033", label: "50–150 above BMR" },
  { color: "#FF0000", label: "Over 150 above BMR" },
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
  | {
      type: "restore";
      foodEntries: Entry[];
      workoutEntries: Entry[];
    }
  | { type: "addEntry"; stream: EntryStream; date: string; calories: number }
  | {
      type: "updateEntryCalories";
      stream: EntryStream;
      entry: Entry;
      calories: number;
    }
  | { type: "deleteEntry"; stream: EntryStream; date: string; count: number };

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
    case "restore": {
      const { foodEntries, workoutEntries } = action;
      saveEntries(foodEntries, workoutEntries);
      return { foodEntries, workoutEntries };
    }
    case "addEntry": {
      const list = entriesForStream(state, action.stream);
      const nextCount = getNextCount(list, action.date);
      const nextForStream = [
        ...list,
        {
          date: action.date,
          calories: Math.max(0, Math.round(action.calories)),
          count: nextCount,
        },
      ];
      return persistStreamEntries(state, action.stream, nextForStream);
    }
    case "updateEntryCalories": {
      const roundCal = Math.max(0, Math.round(action.calories));
      const list = entriesForStream(state, action.stream);
      const nextForStream = list.map((e) =>
        e.date === action.entry.date && e.count === action.entry.count
          ? { ...e, calories: roundCal }
          : e,
      );
      return persistStreamEntries(state, action.stream, nextForStream);
    }
    case "deleteEntry": {
      const list = entriesForStream(state, action.stream);
      const nextForStream = deleteEntryAndRenumber(
        list,
        action.date,
        action.count,
      );
      return persistStreamEntries(state, action.stream, nextForStream);
    }
  }
}

export function getNextCount(entries: Entry[], date: string): number {
  const dayEntries = entries.filter((entry) => entry.date === date);
  if (dayEntries.length === 0) return 1;
  return Math.max(...dayEntries.map((entry) => entry.count)) + 1;
}

/**
 * Removes the entry for `date` with `count`, then renumbers remaining entries on that date
 * to 1..n in ascending order of their previous `count` (stable sequence).
 * Preserves relative order of entries in the full array.
 */
export function deleteEntryAndRenumber(
  entries: Entry[],
  date: string,
  count: number,
): Entry[] {
  const withoutDeleted = entries.filter(
    (e) => !(e.date === date && e.count === count),
  );
  const sameDate = withoutDeleted
    .filter((e) => e.date === date)
    .sort((a, b) => a.count - b.count);
  const oldToNew = new Map<number, number>();
  sameDate.forEach((e, i) => oldToNew.set(e.count, i + 1));
  return withoutDeleted.map((e) => {
    if (e.date !== date) return e;
    const newCount = oldToNew.get(e.count);
    return newCount !== undefined ? { ...e, count: newCount } : e;
  });
}

export function sumCalories(entries: Entry[]): number {
  return entries.reduce((acc, entry) => acc + entry.calories, 0);
}

export function groupedByDate(entries: Entry[]): Record<string, Entry[]> {
  const groups: Record<string, Entry[]> = {};
  for (const entry of entries) {
    if (!groups[entry.date]) {
      groups[entry.date] = [];
    }
    groups[entry.date].push(entry);
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
  net: number;
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
  const meals = (foodByDate[summaryDate] ?? [])
    .slice()
    .sort((a, b) => a.count - b.count);
  const workouts = (workoutsByDate[summaryDate] ?? [])
    .slice()
    .sort((a, b) => a.count - b.count);
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
    net: consumed - burned,
  };
}

export function entryItemLabel(type: "food" | "workout", entry: Entry): string {
  if (type === "food") {
    return `Meal ${entry.count}: ${entry.calories} cal`;
  }
  return `Workout ${entry.count}: ${entry.calories} cal`;
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
