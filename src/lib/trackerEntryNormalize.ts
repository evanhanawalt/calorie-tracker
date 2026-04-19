import {
  trackerEntryWireSchema,
  type TrackerEntryWire,
} from "./trackerWire";

export function newLocalEntryId(): string {
  if (typeof globalThis.crypto?.randomUUID === "function") {
    return globalThis.crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

/**
 * Parses stored JSON arrays into `TrackerEntryWire[]`.
 * Invalid rows are dropped (same behavior as before).
 */
export function normalizeStoredTrackerEntries(
  entries: unknown[],
): TrackerEntryWire[] {
  const out: TrackerEntryWire[] = [];
  for (const entry of entries) {
    const parsed = trackerEntryWireSchema.safeParse(entry);
    if (parsed.success) {
      out.push(parsed.data);
    }
  }
  return out;
}
