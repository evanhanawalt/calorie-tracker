import { describe, expect, it } from "vitest";
import { localTodayIso } from "./routeHttp";

describe("localTodayIso", () => {
  it("formats a fixed Date in local calendar parts", () => {
    expect(localTodayIso(new Date(2024, 0, 5))).toBe("2024-01-05");
    expect(localTodayIso(new Date(2024, 11, 31))).toBe("2024-12-31");
  });
});
