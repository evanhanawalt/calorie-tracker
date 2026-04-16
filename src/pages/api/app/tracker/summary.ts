import type { APIRoute } from "astro";
import { getBmrForUser } from "../../../../db/userSettingsRepo";
import {
  listMealsForDate,
  listWorkoutsForDate,
} from "../../../../db/trackerRepo";
import { isIsoDateString } from "../../../../lib/isoDate";
import {
  mealRowToWire,
  workoutRowToWire,
} from "../../../../lib/trackerWireMappers";
import type { DailySummaryWire } from "../../../../lib/trackerWire";

export const prerender = false;

function sumCalories(
  entries: { calories: number }[],
): number {
  return entries.reduce((a, e) => a + e.calories, 0);
}

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
  const [mealRows, workoutRows, bmr] = await Promise.all([
    listMealsForDate(session.user.id, date),
    listWorkoutsForDate(session.user.id, date),
    getBmrForUser(session.user.id),
  ]);
  const meals = mealRows.map(mealRowToWire);
  const workouts = workoutRows.map(workoutRowToWire);
  const consumed = sumCalories(meals);
  const burned = sumCalories(workouts);
  const body: DailySummaryWire = {
    date,
    bmr,
    meals,
    workouts,
    consumed,
    burned,
    net: consumed - burned,
  };
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
};
