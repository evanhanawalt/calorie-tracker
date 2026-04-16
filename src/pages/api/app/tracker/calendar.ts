import type { APIRoute } from "astro";
import {
  mealTotalsByDateInRange,
  workoutTotalsByDateInRange,
} from "../../../../db/trackerRepo";
import { listIsoDatesInclusive } from "../../../../lib/calendarGrid";
import { isIsoDateString } from "../../../../lib/isoDate";
import type { CalendarDayWire } from "../../../../lib/trackerWire";

export const prerender = false;

export const GET: APIRoute = async ({ locals, url }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const start = url.searchParams.get("start");
  const end = url.searchParams.get("end");
  if (
    !start ||
    !end ||
    !isIsoDateString(start) ||
    !isIsoDateString(end) ||
    start > end
  ) {
    return new Response(
      JSON.stringify({ error: "Missing or invalid start/end (yyyy-mm-dd)" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  const [mealAgg, workoutAgg] = await Promise.all([
    mealTotalsByDateInRange(session.user.id, start, end),
    workoutTotalsByDateInRange(session.user.id, start, end),
  ]);
  const mealMap = new Map(
    mealAgg.map((r) => [
      r.date,
      { calories: r.caloriesSum, rows: r.rowCount },
    ]),
  );
  const workoutMap = new Map(
    workoutAgg.map((r) => [
      r.date,
      { calories: r.caloriesSum, rows: r.rowCount },
    ]),
  );
  const days: CalendarDayWire[] = listIsoDatesInclusive(start, end).map(
    (date) => {
      const m = mealMap.get(date);
      const w = workoutMap.get(date);
      const consumed = m?.calories ?? 0;
      const burned = w?.calories ?? 0;
      const mealRows = m?.rows ?? 0;
      const workoutRows = w?.rows ?? 0;
      return {
        date,
        net: consumed - burned,
        hasActivity: mealRows > 0 || workoutRows > 0,
      };
    },
  );
  return new Response(JSON.stringify({ days }), {
    headers: { "Content-Type": "application/json" },
  });
};
