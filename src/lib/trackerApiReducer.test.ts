import { beforeEach, describe, expect, it, vi } from "vitest";

const sampleMeal = {
  id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
  date: "2024-06-10",
  calories: 300,
  displayOrder: 1,
};

const apiMocks = vi.hoisted(() => ({
  postMeal: vi.fn(),
  postWorkout: vi.fn(),
  patchMeal: vi.fn(),
  patchWorkout: vi.fn(),
  deleteMealApi: vi.fn(),
  deleteWorkoutApi: vi.fn(),
}));

vi.mock("./trackerApiClient", () => apiMocks);

import { runTrackerApiAction } from "./trackerApiReducer";

describe("runTrackerApiAction", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    apiMocks.postMeal.mockResolvedValue(sampleMeal);
    apiMocks.postWorkout.mockResolvedValue({ ...sampleMeal, id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22" });
    apiMocks.patchMeal.mockResolvedValue({ ...sampleMeal, calories: 400 });
    apiMocks.patchWorkout.mockResolvedValue({
      ...sampleMeal,
      id: "b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22",
      calories: 150,
    });
    apiMocks.deleteMealApi.mockResolvedValue(undefined);
    apiMocks.deleteWorkoutApi.mockResolvedValue(undefined);
  });

  it("routes addEntry food to postMeal", async () => {
    const res = await runTrackerApiAction({
      type: "addEntry",
      stream: "food",
      date: "2024-06-10",
      calories: 250,
    });
    expect(apiMocks.postMeal).toHaveBeenCalledWith({
      date: "2024-06-10",
      calories: 250,
    });
    expect(res).toEqual({
      kind: "mutateEntry",
      stream: "food",
      mode: "add",
      entry: sampleMeal,
    });
  });

  it("routes addEntry workout to postWorkout", async () => {
    await runTrackerApiAction({
      type: "addEntry",
      stream: "workout",
      date: "2024-06-11",
      calories: 100,
    });
    expect(apiMocks.postWorkout).toHaveBeenCalledWith({
      date: "2024-06-11",
      calories: 100,
    });
  });

  it("routes updateEntryCalories to patch helpers", async () => {
    await runTrackerApiAction({
      type: "updateEntryCalories",
      stream: "food",
      id: "meal-id-1",
      calories: 400,
    });
    expect(apiMocks.patchMeal).toHaveBeenCalledWith("meal-id-1", 400);

    await runTrackerApiAction({
      type: "updateEntryCalories",
      stream: "workout",
      id: "workout-id-1",
      calories: 150,
    });
    expect(apiMocks.patchWorkout).toHaveBeenCalledWith("workout-id-1", 150);
  });

  it("routes deleteEntry to delete APIs", async () => {
    await runTrackerApiAction({
      type: "deleteEntry",
      stream: "food",
      id: "m1",
    });
    expect(apiMocks.deleteMealApi).toHaveBeenCalledWith("m1");

    await runTrackerApiAction({
      type: "deleteEntry",
      stream: "workout",
      id: "w1",
    });
    expect(apiMocks.deleteWorkoutApi).toHaveBeenCalledWith("w1");
  });
});
