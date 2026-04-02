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
  return sanitizeEntries(safeParseArray(localStorage.getItem(FOOD_STORAGE_KEY)));
}

export function loadWorkoutEntries(): Entry[] {
  return sanitizeEntries(safeParseArray(localStorage.getItem(WORKOUT_STORAGE_KEY)));
}

export function saveEntries(food: Entry[], workouts: Entry[]): void {
  localStorage.setItem(FOOD_STORAGE_KEY, JSON.stringify(food));
  localStorage.setItem(WORKOUT_STORAGE_KEY, JSON.stringify(workouts));
}

export function getNextCount(entries: Entry[], date: string): number {
  const dayEntries = entries.filter((entry) => entry.date === date);
  if (dayEntries.length === 0) return 1;
  return Math.max(...dayEntries.map((entry) => entry.count)) + 1;
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
