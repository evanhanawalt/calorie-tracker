import {
  mealTotalsByDateInRange,
  workoutTotalsByDateInRange,
} from "@/db/trackerRepo";
import { listIsoDatesInclusive } from "@/lib/calendarGrid";
import { jsonData, requireIsoDateRange } from "@/lib/api/routeHttp";
import { requireSession } from "@/lib/auth/readSession";
import type { CalendarDayWire } from "@/lib/trackerWire";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const range = requireIsoDateRange(request);
  if (range instanceof Response) return range;
  const { start, end } = range;

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
  return jsonData({ days });
}
