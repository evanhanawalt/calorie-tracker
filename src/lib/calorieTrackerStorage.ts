export const FOOD_STORAGE_KEY = "calorie_tracker_food_entries";
export const WORKOUT_STORAGE_KEY = "calorie_tracker_workout_entries";

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

export type TrackerState = {
  foodEntries: Entry[];
  workoutEntries: Entry[];
};

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
  | { type: "addFood"; date: string; calories: number }
  | { type: "addWorkout"; date: string; calories: number }
  | { type: "updateFoodCalories"; entry: Entry; calories: number }
  | { type: "updateWorkoutCalories"; entry: Entry; calories: number }
  | { type: "deleteFood"; date: string; count: number }
  | { type: "deleteWorkout"; date: string; count: number };

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
    case "addFood": {
      const nextCount = getNextCount(state.foodEntries, action.date);
      const foodEntries = [
        ...state.foodEntries,
        {
          date: action.date,
          calories: Math.max(0, Math.round(action.calories)),
          count: nextCount,
        },
      ];
      saveEntries(foodEntries, state.workoutEntries);
      return { ...state, foodEntries };
    }
    case "addWorkout": {
      const nextCount = getNextCount(state.workoutEntries, action.date);
      const workoutEntries = [
        ...state.workoutEntries,
        {
          date: action.date,
          calories: Math.max(0, Math.round(action.calories)),
          count: nextCount,
        },
      ];
      saveEntries(state.foodEntries, workoutEntries);
      return { ...state, workoutEntries };
    }
    case "updateFoodCalories": {
      const roundCal = Math.max(0, Math.round(action.calories));
      const foodEntries = state.foodEntries.map((e) =>
        e.date === action.entry.date && e.count === action.entry.count
          ? { ...e, calories: roundCal }
          : e,
      );
      saveEntries(foodEntries, state.workoutEntries);
      return { ...state, foodEntries };
    }
    case "updateWorkoutCalories": {
      const roundCal = Math.max(0, Math.round(action.calories));
      const workoutEntries = state.workoutEntries.map((e) =>
        e.date === action.entry.date && e.count === action.entry.count
          ? { ...e, calories: roundCal }
          : e,
      );
      saveEntries(state.foodEntries, workoutEntries);
      return { ...state, workoutEntries };
    }
    case "deleteFood": {
      const foodEntries = deleteEntryAndRenumber(
        state.foodEntries,
        action.date,
        action.count,
      );
      saveEntries(foodEntries, state.workoutEntries);
      return { ...state, foodEntries };
    }
    case "deleteWorkout": {
      const workoutEntries = deleteEntryAndRenumber(
        state.workoutEntries,
        action.date,
        action.count,
      );
      saveEntries(state.foodEntries, workoutEntries);
      return { ...state, workoutEntries };
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
