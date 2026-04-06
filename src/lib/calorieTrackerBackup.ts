import {
  sanitizeEntries,
  type Entry,
  type TrackerState,
} from "./calorieTrackerStorage";

export const DEFAULT_BACKUP_FILENAME = "calorie-tracker-backup.json";

export function serializeTrackerBackup(state: TrackerState): string {
  return JSON.stringify(
    {
      foodEntries: state.foodEntries,
      workoutEntries: state.workoutEntries,
    },
    null,
    2,
  );
}

export function createTrackerBackupBlob(state: TrackerState): Blob {
  return new Blob([serializeTrackerBackup(state)], {
    type: "application/json",
  });
}

export type ParsedTrackerBackup =
  | { ok: true; foodEntries: Entry[]; workoutEntries: Entry[] }
  | { ok: false };

export function parseTrackerBackupFile(text: string): ParsedTrackerBackup {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false };
  }
  if (!parsed || typeof parsed !== "object") return { ok: false };
  const o = parsed as { foodEntries?: unknown; workoutEntries?: unknown };
  return {
    ok: true,
    foodEntries: sanitizeEntries(
      Array.isArray(o.foodEntries) ? o.foodEntries : [],
    ),
    workoutEntries: sanitizeEntries(
      Array.isArray(o.workoutEntries) ? o.workoutEntries : [],
    ),
  };
}

export type DownloadTrackerBackupResult = { saved: boolean };

/**
 * Uses the File System Access save picker when available; otherwise triggers a download.
 * Returns `{ saved: false }` when the user aborts the picker (no file written).
 */
export async function downloadTrackerBackup(
  state: TrackerState,
): Promise<DownloadTrackerBackupResult> {
  const blob = createTrackerBackupBlob(state);

  if (typeof window.showSaveFilePicker === "function") {
    try {
      const handle = await window.showSaveFilePicker({
        startIn: "downloads",
        suggestedName: DEFAULT_BACKUP_FILENAME,
        types: [
          {
            description: "JSON",
            accept: { "application/json": [".json"] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return { saved: true };
    } catch (err) {
      if (err instanceof DOMException && err.name === "AbortError") {
        return { saved: false };
      }
    }
  }

  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = DEFAULT_BACKUP_FILENAME;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
  return { saved: true };
}
