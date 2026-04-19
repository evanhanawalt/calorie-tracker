import { getBmrForUser } from "@/db/userSettingsRepo";
import {
  listMealsForDate,
  listWorkoutsForDate,
} from "@/db/trackerRepo";
import { jsonData, requireIsoDateQuery } from "@/lib/api/routeHttp";
import { requireSession } from "@/lib/auth/readSession";
import {
  mealRowToWire,
  workoutRowToWire,
} from "@/lib/trackerWireMappers";
import type { DailySummaryWire } from "@/lib/trackerWire";

export const dynamic = "force-dynamic";

function sumCalories(entries: { calories: number }[]): number {
  return entries.reduce((a, e) => a + e.calories, 0);
}

export async function GET(request: Request) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const date = requireIsoDateQuery(request, "date");
  if (date instanceof Response) return date;

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
  return jsonData(body);
}
