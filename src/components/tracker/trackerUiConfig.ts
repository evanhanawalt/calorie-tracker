import type { EntryStream } from "../../lib/calorieTrackerStorage";

export type { EntryStream };

export type StreamUi = {
  fieldLabel: string;
  invalidLogCalories: string;
  addedMessage: string;
  listEmptyText: string;
  editSuccess: string;
  deleteSuccess: string;
  singular: string;
};

export const STREAM_UI: Record<EntryStream, StreamUi> = {
  food: {
    fieldLabel: "Calories",
    invalidLogCalories: "Please enter valid calories.",
    addedMessage: "Meal added.",
    listEmptyText: "Add your first meal",
    editSuccess: "Meal updated.",
    deleteSuccess: "Meal deleted.",
    singular: "meal",
  },
  workout: {
    fieldLabel: "Calories Burned",
    invalidLogCalories: "Please enter valid calories burned.",
    addedMessage: "Workout added.",
    listEmptyText: "Add your first workout",
    editSuccess: "Workout updated.",
    deleteSuccess: "Workout deleted.",
    singular: "workout",
  },
};
