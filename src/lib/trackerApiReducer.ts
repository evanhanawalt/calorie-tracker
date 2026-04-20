import type {
  EntryStream,
  TrackerAction,
  TrackerState,
} from "./calorieTrackerStorage";
import {
  getInitialTrackerState,
  trackerReducer,
} from "./calorieTrackerStorage";
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
 * Applies the same logical actions as `trackerReducer`, but persists via `/api/app/*`.
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

function entriesForStream(state: TrackerState, stream: EntryStream) {
  return stream === "food" ? state.foodEntries : state.workoutEntries;
}

/**
 * Same logical actions as `runTrackerApiAction`, persisting via `trackerReducer` + localStorage.
 */
export function runLocalTrackerAction(
  action: TrackerAction,
): Promise<TrackerApiActionResult> {
  const before = getInitialTrackerState();
  const after = trackerReducer(before, action);

  switch (action.type) {
    case "addEntry": {
      const list = entriesForStream(after, action.stream).filter(
        (e) => e.date === action.date,
      );
      if (list.length === 0) {
        throw new Error("Local add: entry not found");
      }
      const entry = list.reduce((a, b) =>
        a.displayOrder >= b.displayOrder ? a : b,
      );
      return Promise.resolve({
        kind: "mutateEntry",
        stream: action.stream,
        mode: "add",
        entry,
      });
    }
    case "updateEntryCalories": {
      const list = entriesForStream(after, action.stream);
      const entry = list.find((e) => e.id === action.id);
      if (!entry) throw new Error("Local update: entry not found");
      return Promise.resolve({
        kind: "mutateEntry",
        stream: action.stream,
        mode: "update",
        entry,
      });
    }
    case "deleteEntry": {
      return Promise.resolve({
        kind: "deleteEntry",
        stream: action.stream,
        id: action.id,
      });
    }
  }
}
