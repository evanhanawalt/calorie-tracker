import { describe, expect, it } from "vitest";
import {
  bmrPatchBodySchema,
  isoDateRangeQuerySchema,
  isoDateStringSchema,
  trackerEntryWireSchema,
} from "./tracker";

describe("isoDateStringSchema", () => {
  it("accepts valid calendar dates", () => {
    expect(isoDateStringSchema.safeParse("2024-01-15").success).toBe(true);
    expect(isoDateStringSchema.safeParse("2024-02-29").success).toBe(true);
  });

  it("rejects invalid shapes and impossible dates", () => {
    expect(isoDateStringSchema.safeParse("24-01-01").success).toBe(false);
    expect(isoDateStringSchema.safeParse("2024-13-01").success).toBe(false);
    expect(isoDateStringSchema.safeParse("2024-02-30").success).toBe(false);
  });
});

describe("isoDateRangeQuerySchema", () => {
  it("accepts ordered ranges within max span", () => {
    const r = isoDateRangeQuerySchema.safeParse({
      start: "2024-01-01",
      end: "2024-01-07",
    });
    expect(r.success).toBe(true);
  });

  it("rejects start after end", () => {
    const r = isoDateRangeQuerySchema.safeParse({
      start: "2024-01-10",
      end: "2024-01-01",
    });
    expect(r.success).toBe(false);
  });
});

describe("bmrPatchBodySchema", () => {
  it("accepts integers in range", () => {
    const r = bmrPatchBodySchema.safeParse({ bmrKcal: 2000 });
    expect(r.success).toBe(true);
    if (r.success) expect(r.data.bmrKcal).toBe(2000);
  });

  it("rejects out of range", () => {
    expect(bmrPatchBodySchema.safeParse({ bmrKcal: 499 }).success).toBe(false);
    expect(bmrPatchBodySchema.safeParse({ bmrKcal: 20001 }).success).toBe(
      false,
    );
  });
});

describe("trackerEntryWireSchema", () => {
  it("accepts valid wire rows", () => {
    const r = trackerEntryWireSchema.safeParse({
      id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
      date: "2024-06-01",
      calories: 100,
      displayOrder: 1,
    });
    expect(r.success).toBe(true);
  });

  it("rejects extra keys and invalid types", () => {
    expect(
      trackerEntryWireSchema.safeParse({
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        date: "2024-06-01",
        calories: 1,
        displayOrder: 1,
        extra: true,
      }).success,
    ).toBe(false);
    expect(
      trackerEntryWireSchema.safeParse({
        id: "a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11",
        date: "2024-06-01",
        calories: "100",
        displayOrder: 1,
      }).success,
    ).toBe(false);
  });
});
