import type { TrackerAction } from "./calorieTrackerStorage";
import {
  deleteMealApi,
  deleteWorkoutApi,
  patchMeal,
  patchWorkout,
  postMeal,
  postTrackerRestore,
  postWorkout,
} from "./trackerApiClient";

/**
 * Applies the same logical actions as `trackerReducer`, but persists via `/api/app/*`.
 * Intended for use inside TanStack Query `mutationFn` (not a synchronous React reducer).
 */
export async function runTrackerApiAction(action: TrackerAction): Promise<void> {
  switch (action.type) {
    case "restore":
      await postTrackerRestore({
        foodEntries: action.foodEntries,
        workoutEntries: action.workoutEntries,
      });
      return;
    case "addEntry": {
      if (action.stream === "food") {
        await postMeal({ date: action.date, calories: action.calories });
        return;
      }
      await postWorkout({ date: action.date, calories: action.calories });
      return;
    }
    case "updateEntryCalories": {
      if (action.stream === "food") {
        await patchMeal(action.id, action.calories);
        return;
      }
      await patchWorkout(action.id, action.calories);
      return;
    }
    case "deleteEntry": {
      if (action.stream === "food") {
        await deleteMealApi(action.id);
        return;
      }
      await deleteWorkoutApi(action.id);
      return;
    }
  }
}
