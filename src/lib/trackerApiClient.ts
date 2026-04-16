import type { TrackerState } from "./calorieTrackerStorage";
import type {
  CalendarDayWire,
  DailySummaryWire,
  UserSettingsWire,
} from "./trackerWire";

const APP = "/api/app";

async function readJson<T>(res: Response): Promise<T> {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON (${res.status})`);
  }
  if (!res.ok) {
    const msg =
      data &&
      typeof data === "object" &&
      "error" in data &&
      typeof (data as { error?: unknown }).error === "string"
        ? (data as { error: string }).error
        : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  return data as T;
}

export async function fetchDailySummary(date: string): Promise<DailySummaryWire> {
  const res = await fetch(
    `${APP}/tracker/summary?date=${encodeURIComponent(date)}`,
    { credentials: "same-origin", headers: { Accept: "application/json" } },
  );
  return readJson<DailySummaryWire>(res);
}

export async function fetchCalendarDays(
  start: string,
  end: string,
): Promise<CalendarDayWire[]> {
  const q = new URLSearchParams({ start, end });
  const res = await fetch(`${APP}/tracker/calendar?${q}`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  const data = await readJson<{ days: CalendarDayWire[] }>(res);
  return data.days;
}

export async function fetchUserSettings(): Promise<UserSettingsWire> {
  const res = await fetch(`${APP}/settings`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  return readJson<UserSettingsWire>(res);
}

export async function patchUserSettings(
  body: UserSettingsWire,
): Promise<UserSettingsWire> {
  const res = await fetch(`${APP}/settings`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  return readJson<UserSettingsWire>(res);
}

export async function postMeal(body: {
  date: string;
  calories: number;
}): Promise<void> {
  const res = await fetch(`${APP}/meals`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ date: body.date, calories: body.calories }),
  });
  await readJson<{ meal: unknown }>(res);
}

export async function patchMeal(id: string, calories: number): Promise<void> {
  const res = await fetch(`${APP}/meals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ calories }),
  });
  await readJson<{ meal: unknown }>(res);
}

export async function deleteMealApi(id: string): Promise<void> {
  const res = await fetch(`${APP}/meals/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  await readJson<{ ok: boolean }>(res);
}

export async function postWorkout(body: {
  date: string;
  calories: number;
}): Promise<void> {
  const res = await fetch(`${APP}/workouts`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ date: body.date, calories: body.calories }),
  });
  await readJson<{ workout: unknown }>(res);
}

export async function patchWorkout(
  id: string,
  calories: number,
): Promise<void> {
  const res = await fetch(`${APP}/workouts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ calories }),
  });
  await readJson<{ workout: unknown }>(res);
}

export async function deleteWorkoutApi(id: string): Promise<void> {
  const res = await fetch(`${APP}/workouts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  await readJson<{ ok: boolean }>(res);
}

export async function postTrackerRestore(
  state: TrackerState,
): Promise<void> {
  const res = await fetch(`${APP}/tracker/restore`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      foodEntries: state.foodEntries,
      workoutEntries: state.workoutEntries,
    }),
  });
  await readJson<{ ok: boolean }>(res);
}

export async function fetchTrackerBackupExport(): Promise<TrackerState> {
  const res = await fetch(`${APP}/tracker/backup`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  return readJson<TrackerState>(res);
}
