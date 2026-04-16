import type { APIRoute } from "astro";
import {
  listAllMealsForUser,
  listAllWorkoutsForUser,
} from "../../../../db/trackerRepo";
import {
  mealRowToWire,
  workoutRowToWire,
} from "../../../../lib/trackerWireMappers";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const [mealRows, workoutRows] = await Promise.all([
    listAllMealsForUser(session.user.id),
    listAllWorkoutsForUser(session.user.id),
  ]);
  const foodEntries = mealRows.map(mealRowToWire);
  const workoutEntries = workoutRows.map(workoutRowToWire);
  return new Response(JSON.stringify({ foodEntries, workoutEntries }), {
    headers: { "Content-Type": "application/json" },
  });
};
