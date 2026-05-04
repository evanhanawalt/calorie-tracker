import { describe, expect, it } from "vitest";
import {
  isLogDateAllowed,
  parseNonNegativeCalories,
} from "./calorieTrackerValidators";

describe("isLogDateAllowed", () => {
  it("rejects empty date string", () => {
    expect(isLogDateAllowed("", "2024-01-01")).toBe(false);
  });

  it("allows today and past dates", () => {
    expect(isLogDateAllowed("2024-01-01", "2024-01-01")).toBe(true);
    expect(isLogDateAllowed("2023-12-31", "2024-01-01")).toBe(true);
  });

  it("rejects future dates", () => {
    expect(isLogDateAllowed("2024-01-02", "2024-01-01")).toBe(false);
  });
});

describe("parseNonNegativeCalories", () => {
  it("returns rounded valid numbers", () => {
    expect(parseNonNegativeCalories(0)).toBe(0);
    expect(parseNonNegativeCalories(100)).toBe(100);
  });

  it("returns null for negative or non-finite", () => {
    expect(parseNonNegativeCalories(-1)).toBe(null);
    expect(parseNonNegativeCalories(Number.NaN)).toBe(null);
  });
});
