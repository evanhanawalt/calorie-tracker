import type { APIRoute } from "astro";
import { replaceAllTrackerEntries } from "../../../../db/trackerRepo";
import type { Entry } from "../../../../lib/calorieTrackerStorage";
import { normalizeStoredTrackerEntries } from "../../../../lib/trackerEntryNormalize";

export const prerender = false;

type RestoreBody = {
  foodEntries?: unknown;
  workoutEntries?: unknown;
};

function entriesToRestoreRows(entries: Entry[]) {
  return entries.map((e) => ({
    entryDate: e.date,
    calories: e.calories,
    displayOrder: e.displayOrder,
  }));
}

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
  const { foodEntries, workoutEntries } = payload as RestoreBody;
  const meals = normalizeStoredTrackerEntries(
    Array.isArray(foodEntries) ? foodEntries : [],
  );
  const workouts = normalizeStoredTrackerEntries(
    Array.isArray(workoutEntries) ? workoutEntries : [],
  );
  await replaceAllTrackerEntries({
    userId: session.user.id,
    meals: entriesToRestoreRows(meals),
    workouts: entriesToRestoreRows(workouts),
  });
  return new Response(JSON.stringify({ ok: true }), {
    headers: { "Content-Type": "application/json" },
  });
};
