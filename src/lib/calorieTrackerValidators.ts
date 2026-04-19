import { z } from "zod";

const nonNegativeFiniteCaloriesSchema = z.number().finite().min(0);

/**
 * Shared validation for logging and editing entries (yyyy-mm-dd compares lexicographically).
 */
export function isLogDateAllowed(date: string, todayIso: string): boolean {
  return date.length > 0 && date <= todayIso;
}

export function parseNonNegativeCalories(value: number): number | null {
  const result = nonNegativeFiniteCaloriesSchema.safeParse(value);
  return result.success ? result.data : null;
}
