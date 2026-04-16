import type { MealEntryRow, WorkoutEntryRow } from "../db/schema";
import type { TrackerEntryWire } from "./trackerWire";

export function mealRowToWire(row: MealEntryRow): TrackerEntryWire {
  return {
    id: row.id,
    date: row.entryDate,
    calories: row.calories,
    displayOrder: row.displayOrder,
  };
}

export function workoutRowToWire(row: WorkoutEntryRow): TrackerEntryWire {
  return {
    id: row.id,
    date: row.entryDate,
    calories: row.calories,
    displayOrder: row.displayOrder,
  };
}
