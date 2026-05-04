import { describe, expect, it } from "vitest";
import type { Entry } from "./trackerDomain";
import {
  formatDateForDisplay,
  getDailyTrackerDerivations,
  getNextDisplayOrder,
  groupedByDate,
  netVsBmrBand,
  sortEntriesForDay,
  sumCalories,
} from "./trackerDomain";

function entry(
  partial: Pick<Entry, "id" | "date" | "calories" | "displayOrder">,
): Entry {
  return {
    id: partial.id,
    date: partial.date,
    calories: partial.calories,
    displayOrder: partial.displayOrder,
  };
}

describe("netVsBmrBand", () => {
  const bmr = 2000;
  it("classifies boundary deltas per NET_VS_BMR_BANDS", () => {
    expect(netVsBmrBand(bmr + 200, bmr).minDelta).toBe(200);
    expect(netVsBmrBand(bmr + 199, bmr).minDelta).toBe(100);
    expect(netVsBmrBand(bmr + 100, bmr).minDelta).toBe(100);
    expect(netVsBmrBand(bmr + 99, bmr).minDelta).toBe(-100);
    expect(netVsBmrBand(bmr - 100, bmr).minDelta).toBe(-100);
    expect(netVsBmrBand(bmr - 101, bmr).minDelta).toBe(-200);
    expect(netVsBmrBand(bmr - 200, bmr).minDelta).toBe(-200);
    expect(netVsBmrBand(bmr - 201, bmr).minDelta).toBe(-Infinity);
  });
});

describe("getNextDisplayOrder", () => {
  it("returns 1 when no entries for date", () => {
    expect(getNextDisplayOrder([], "2024-01-01")).toBe(1);
  });

  it("returns max displayOrder + 1 for that date", () => {
    const entries = [
      entry({
        id: "a",
        date: "2024-01-01",
        calories: 1,
        displayOrder: 1,
      }),
      entry({
        id: "b",
        date: "2024-01-01",
        calories: 2,
        displayOrder: 3,
      }),
      entry({
        id: "c",
        date: "2024-01-02",
        displayOrder: 99,
        calories: 1,
      }),
    ];
    expect(getNextDisplayOrder(entries, "2024-01-01")).toBe(4);
  });
});

describe("sumCalories", () => {
  it("sums calories", () => {
    expect(
      sumCalories([
        entry({
          id: "1",
          date: "d",
          calories: 100,
          displayOrder: 1,
        }),
        entry({
          id: "2",
          date: "d",
          calories: 50,
          displayOrder: 2,
        }),
      ]),
    ).toBe(150);
  });
});

describe("sortEntriesForDay", () => {
  it("sorts by displayOrder then id", () => {
    const sorted = sortEntriesForDay([
      entry({
        id: "z",
        date: "d",
        calories: 1,
        displayOrder: 2,
      }),
      entry({
        id: "a",
        date: "d",
        calories: 1,
        displayOrder: 2,
      }),
      entry({
        id: "b",
        date: "d",
        calories: 1,
        displayOrder: 1,
      }),
    ]);
    expect(sorted.map((e) => e.id)).toEqual(["b", "a", "z"]);
  });
});

describe("getDailyTrackerDerivations", () => {
  it("computes meals, workouts, and net for summary date", () => {
    const food = [
      entry({
        id: "m1",
        date: "2024-01-10",
        calories: 500,
        displayOrder: 1,
      }),
    ];
    const workouts = [
      entry({
        id: "w1",
        date: "2024-01-10",
        calories: 200,
        displayOrder: 1,
      }),
    ];
    const d = getDailyTrackerDerivations(food, workouts, "2024-01-10");
    expect(d.consumed).toBe(500);
    expect(d.burned).toBe(200);
    expect(d.netConsumed).toBe(300);
    expect(d.meals).toHaveLength(1);
    expect(d.workouts).toHaveLength(1);
    expect(d.allDates).toContain("2024-01-10");
  });
});

describe("groupedByDate", () => {
  it("groups and sorts within each date", () => {
    const g = groupedByDate([
      entry({
        id: "b",
        date: "2024-01-01",
        calories: 1,
        displayOrder: 2,
      }),
      entry({
        id: "a",
        date: "2024-01-01",
        calories: 1,
        displayOrder: 1,
      }),
    ]);
    expect(Object.keys(g)).toEqual(["2024-01-01"]);
    expect(g["2024-01-01"].map((e) => e.id)).toEqual(["a", "b"]);
  });
});

describe("formatDateForDisplay", () => {
  it("returns original string for invalid iso", () => {
    expect(formatDateForDisplay("nope")).toBe("nope");
  });

  it("formats valid yyyy-mm-dd", () => {
    expect(formatDateForDisplay("2024-03-05")).toMatch(/March/);
    expect(formatDateForDisplay("2024-03-05")).toMatch(/5/);
    expect(formatDateForDisplay("2024-03-05")).toMatch(/2024/);
  });
});
