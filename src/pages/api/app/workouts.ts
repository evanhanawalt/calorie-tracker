import type { APIRoute } from "astro";
import {
  insertWorkout,
  listWorkoutsForDate,
  nextWorkoutDisplayOrder,
} from "../../../db/trackerRepo";
import { isIsoDateString } from "../../../lib/isoDate";
import { parseNonNegativeCalories } from "../../../lib/calorieTrackerValidators";
import { workoutRowToWire } from "../../../lib/trackerWireMappers";

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const date = url.searchParams.get("date");
  if (!date || !isIsoDateString(date)) {
    return new Response(JSON.stringify({ error: "Missing or invalid date" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const rows = await listWorkoutsForDate(session.user.id, date);
  return new Response(
    JSON.stringify({ workouts: rows.map(workoutRowToWire) }),
    { headers: { "Content-Type": "application/json" } },
  );
};

export const POST: APIRoute = async ({ locals, request }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!payload || typeof payload !== "object") {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const date = (payload as { date?: unknown }).date;
  const caloriesRaw = (payload as { calories?: unknown }).calories;
  if (typeof date !== "string" || !isIsoDateString(date)) {
    return new Response(JSON.stringify({ error: "Invalid date" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const calories =
    typeof caloriesRaw === "number"
      ? parseNonNegativeCalories(caloriesRaw)
      : null;
  if (calories === null) {
    return new Response(JSON.stringify({ error: "Invalid calories" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const displayOrder = await nextWorkoutDisplayOrder(session.user.id, date);
  const row = await insertWorkout({
    userId: session.user.id,
    entryDate: date,
    calories: Math.round(calories),
    displayOrder,
  });
  if (!row) {
    return new Response(JSON.stringify({ error: "Insert failed" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ workout: workoutRowToWire(row) }), {
    status: 201,
    headers: { "Content-Type": "application/json" },
  });
};
