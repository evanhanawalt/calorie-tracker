import type { EntryStream, TrackerAction } from "./trackerDomain";
import {
  deleteMealApi,
  deleteWorkoutApi,
  patchMeal,
  patchWorkout,
  postMeal,
  postWorkout,
} from "./trackerApiClient";
import type { TrackerEntryWire } from "./trackerWire";

export type TrackerApiActionResult =
  | {
      kind: "mutateEntry";
      stream: EntryStream;
      mode: "add" | "update";
      entry: TrackerEntryWire;
    }
  | { kind: "deleteEntry"; stream: EntryStream; id: string };

/**
 * Applies tracker mutations and persists via `/api/app/*`.
 * Intended for use inside TanStack Query `mutationFn` (not a synchronous React reducer).
 */
export async function runTrackerApiAction(
  action: TrackerAction,
): Promise<TrackerApiActionResult> {
  switch (action.type) {
    case "addEntry": {
      if (action.stream === "food") {
        const entry = await postMeal({
          date: action.date,
          calories: action.calories,
        });
        return { kind: "mutateEntry", stream: "food", mode: "add", entry };
      }
      const entry = await postWorkout({
        date: action.date,
        calories: action.calories,
      });
      return { kind: "mutateEntry", stream: "workout", mode: "add", entry };
    }
    case "updateEntryCalories": {
      if (action.stream === "food") {
        const entry = await patchMeal(action.id, action.calories);
        return { kind: "mutateEntry", stream: "food", mode: "update", entry };
      }
      const entry = await patchWorkout(action.id, action.calories);
      return { kind: "mutateEntry", stream: "workout", mode: "update", entry };
    }
    case "deleteEntry": {
      if (action.stream === "food") {
        await deleteMealApi(action.id);
        return { kind: "deleteEntry", stream: "food", id: action.id };
      }
      await deleteWorkoutApi(action.id);
      return { kind: "deleteEntry", stream: "workout", id: action.id };
    }
  }
}
