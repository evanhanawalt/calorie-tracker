/**
 * Shared validation for logging and editing entries (yyyy-mm-dd compares lexicographically).
 */
export function isLogDateAllowed(date: string, todayIso: string): boolean {
  return date.length > 0 && date <= todayIso;
}

export function parseNonNegativeCalories(value: number): number | null {
  if (!Number.isFinite(value) || value < 0) return null;
  return value;
}
