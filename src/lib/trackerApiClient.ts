import {
  apiErrorBodySchema,
  calendarDaysResponseSchema,
  dailySummaryWireSchema,
  deleteOkResponseSchema,
  mealMutationResponseSchema,
  userSettingsWireSchema,
  workoutMutationResponseSchema,
  type CalendarDayWire,
  type DailySummaryWire,
  type TrackerEntryWire,
  type UserSettingsWire,
} from "./trackerWire";
import type { z } from "zod";

const APP = "/api/app";

function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid response";
}

async function readJsonResponse<T>(
  res: Response,
  schema: z.ZodType<T>,
): Promise<T> {
  const text = await res.text();
  let data: unknown;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    throw new Error(`Invalid JSON (${res.status})`);
  }
  if (!res.ok) {
    const errParsed = apiErrorBodySchema.safeParse(data);
    const msg = errParsed.success
      ? errParsed.data.error
      : `Request failed (${res.status})`;
    throw new Error(msg);
  }
  const parsed = schema.safeParse(data);
  if (!parsed.success) {
    throw new Error(firstZodMessage(parsed.error));
  }
  return parsed.data;
}

export async function fetchDailySummary(date: string): Promise<DailySummaryWire> {
  const res = await fetch(
    `${APP}/tracker/summary?date=${encodeURIComponent(date)}`,
    { credentials: "same-origin", headers: { Accept: "application/json" } },
  );
  return readJsonResponse(res, dailySummaryWireSchema);
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
  const data = await readJsonResponse(res, calendarDaysResponseSchema);
  return data.days;
}

export async function fetchUserSettings(): Promise<UserSettingsWire> {
  const res = await fetch(`${APP}/settings`, {
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  return readJsonResponse(res, userSettingsWireSchema);
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
  return readJsonResponse(res, userSettingsWireSchema);
}

export async function postMeal(body: {
  date: string;
  calories: number;
}): Promise<TrackerEntryWire> {
  const res = await fetch(`${APP}/meals`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ date: body.date, calories: body.calories }),
  });
  const data = await readJsonResponse(res, mealMutationResponseSchema);
  return data.meal;
}

export async function patchMeal(
  id: string,
  calories: number,
): Promise<TrackerEntryWire> {
  const res = await fetch(`${APP}/meals/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ calories }),
  });
  const data = await readJsonResponse(res, mealMutationResponseSchema);
  return data.meal;
}

export async function deleteMealApi(id: string): Promise<void> {
  const res = await fetch(`${APP}/meals/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  await readJsonResponse(res, deleteOkResponseSchema);
}

export async function postWorkout(body: {
  date: string;
  calories: number;
}): Promise<TrackerEntryWire> {
  const res = await fetch(`${APP}/workouts`, {
    method: "POST",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ date: body.date, calories: body.calories }),
  });
  const data = await readJsonResponse(res, workoutMutationResponseSchema);
  return data.workout;
}

export async function patchWorkout(
  id: string,
  calories: number,
): Promise<TrackerEntryWire> {
  const res = await fetch(`${APP}/workouts/${encodeURIComponent(id)}`, {
    method: "PATCH",
    credentials: "same-origin",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ calories }),
  });
  const data = await readJsonResponse(res, workoutMutationResponseSchema);
  return data.workout;
}

export async function deleteWorkoutApi(id: string): Promise<void> {
  const res = await fetch(`${APP}/workouts/${encodeURIComponent(id)}`, {
    method: "DELETE",
    credentials: "same-origin",
    headers: { Accept: "application/json" },
  });
  await readJsonResponse(res, deleteOkResponseSchema);
}
