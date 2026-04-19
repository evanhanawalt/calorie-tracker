import type { EntryStream } from "../../lib/calorieTrackerStorage";

export type { EntryStream };

export const STREAM_ORDER: EntryStream[] = ["food", "workout"];

export type StreamUi = {
  logSectionTitle: string;
  formId: string;
  inputId: string;
  fieldLabel: string;
  submitLabel: string;
  submitButtonClass: string;
  invalidLogCalories: string;
  addedMessage: string;
  listHeading: string;
  listEmptyText: string;
  listKeyPrefix: string;
  editSuccess: string;
  deleteSuccess: string;
  singular: string;
};

export const STREAM_UI: Record<EntryStream, StreamUi> = {
  food: {
    logSectionTitle: "Add Meal",
    formId: "food-form",
    inputId: "food-calories",
    fieldLabel: "Calories",
    submitLabel: "Add Meal",
    submitButtonClass:
      "rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700",
    invalidLogCalories: "Please enter valid calories.",
    addedMessage: "Meal added.",
    listHeading: "Meals",
    listEmptyText: "No meals logged",
    listKeyPrefix: "food",
    editSuccess: "Meal updated.",
    deleteSuccess: "Meal deleted.",
    singular: "meal",
  },
  workout: {
    logSectionTitle: "Add Workout",
    formId: "workout-form",
    inputId: "workout-calories",
    fieldLabel: "Calories Burned",
    submitLabel: "Add Workout",
    submitButtonClass:
      "rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700",
    invalidLogCalories: "Please enter valid calories burned.",
    addedMessage: "Workout added.",
    listHeading: "Workouts",
    listEmptyText: "No workouts logged",
    listKeyPrefix: "wo",
    editSuccess: "Workout updated.",
    deleteSuccess: "Workout deleted.",
    singular: "workout",
  },
};
