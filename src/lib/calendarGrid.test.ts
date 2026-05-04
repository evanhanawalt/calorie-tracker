import { describe, expect, it } from "vitest";
import {
  buildContributionCells,
  listIsoDatesInclusive,
  parseIsoLocal,
  toIsoLocal,
} from "./calendarGrid";

describe("parseIsoLocal / toIsoLocal", () => {
  it("round-trips a valid yyyy-mm-dd", () => {
    const d = parseIsoLocal("2024-06-15");
    expect(Number.isNaN(d.getTime())).toBe(false);
    expect(toIsoLocal(d)).toBe("2024-06-15");
  });

  it("returns NaN date for invalid input", () => {
    expect(Number.isNaN(parseIsoLocal("").getTime())).toBe(true);
    expect(Number.isNaN(parseIsoLocal("2024-xx-01").getTime())).toBe(true);
  });
});

describe("listIsoDatesInclusive", () => {
  it("lists consecutive days inclusive", () => {
    expect(listIsoDatesInclusive("2024-01-01", "2024-01-03")).toEqual([
      "2024-01-01",
      "2024-01-02",
      "2024-01-03",
    ]);
  });

  it("returns empty for invalid range", () => {
    expect(listIsoDatesInclusive("bad", "2024-01-01")).toEqual([]);
  });

  it("returns single day when start equals end", () => {
    expect(listIsoDatesInclusive("2024-02-28", "2024-02-28")).toEqual([
      "2024-02-28",
    ]);
  });
});

describe("buildContributionCells", () => {
  it("returns empty for invalid todayIso", () => {
    expect(buildContributionCells("not-a-date")).toEqual([]);
  });

  it("marks cells after todayIso as future", () => {
    const cells = buildContributionCells("2024-06-10", 2);
    const future = cells.filter((c) => c.isFuture);
    const pastOrToday = cells.filter((c) => !c.isFuture);
    expect(future.length).toBeGreaterThan(0);
    expect(pastOrToday.length).toBeGreaterThan(0);
    expect(future.every((c) => c.iso > "2024-06-10")).toBe(true);
  });
});
