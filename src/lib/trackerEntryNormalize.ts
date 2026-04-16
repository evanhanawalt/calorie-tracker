import { TRACKER_ENTRY_WIRE_KEYS, type TrackerEntryWire } from "./trackerWire";

const WIRE_KEY_SET = new Set<string>(TRACKER_ENTRY_WIRE_KEYS);

export function newLocalEntryId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function hasExactWireKeys(o: Record<string, unknown>): boolean {
  const keys = Object.keys(o);
  if (keys.length !== WIRE_KEY_SET.size) return false;
  for (const k of keys) {
    if (!WIRE_KEY_SET.has(k)) return false;
  }
  return true;
}

function parseWireEntry(entry: unknown): TrackerEntryWire | null {
  if (entry === null || typeof entry !== "object") return null;
  const o = entry as Record<string, unknown>;
  if (!hasExactWireKeys(o)) return null;

  const id = o.id;
  const date = o.date;
  const calories = o.calories;
  const displayOrder = o.displayOrder;

  if (typeof id !== "string" || id.length === 0) return null;
  if (typeof date !== "string" || date.length === 0) return null;
  if (typeof calories !== "number" || !Number.isFinite(calories)) return null;
  if (
    typeof displayOrder !== "number" ||
    !Number.isInteger(displayOrder) ||
    displayOrder < 1
  ) {
    return null;
  }

  return {
    id,
    date,
    calories: Math.max(0, Math.round(calories)),
    displayOrder,
  };
}

/**
 * Parses stored JSON arrays into `TrackerEntryWire[]`.
 * Each object must be exactly `{ id, date, calories, displayOrder }` with valid values; invalid rows are dropped.
 */
export function normalizeStoredTrackerEntries(
  entries: unknown[],
): TrackerEntryWire[] {
  return entries
    .map(parseWireEntry)
    .filter((e): e is TrackerEntryWire => e !== null);
}
