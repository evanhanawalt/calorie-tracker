import type { APIRoute } from "astro";
import { deleteWorkout, updateWorkoutCalories } from "../../../../db/trackerRepo";
import { parseNonNegativeCalories } from "../../../../lib/calorieTrackerValidators";
import { workoutRowToWire } from "../../../../lib/trackerWireMappers";

export const prerender = false;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export const PATCH: APIRoute = async ({ locals, params, request }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const id = params.id;
  if (!id || !UUID_RE.test(id)) {
    return new Response(JSON.stringify({ error: "Invalid id" }), {
      status: 400,
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
  const caloriesRaw = (payload as { calories?: unknown }).calories;
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
  const row = await updateWorkoutCalories(
    session.user.id,
    id,
    Math.round(calories),
  );
  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ workout: workoutRowToWire(row) }), {
    headers: { "Content-Type": "application/json" },
  });
};

export const DELETE: APIRoute = async ({ locals, params }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const id = params.id;
  if (!id || !UUID_RE.test(id)) {
    return new Response(JSON.stringify({ error: "Invalid id" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const row = await deleteWorkout(session.user.id, id);
  if (!row) {
    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
