import { insertWorkout, listWorkoutsForDate } from "@/db/trackerRepo";
import { jsonData, readJsonZod, requireIsoDateQuery } from "@/lib/api/routeHttp";
import { requireSession } from "@/lib/auth/readSession";
import { entryPostBodySchema } from "@/lib/trackerWire";
import { workoutRowToWire } from "@/lib/trackerWireMappers";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const date = requireIsoDateQuery(request, "date");
  if (date instanceof Response) return date;

  const rows = await listWorkoutsForDate(session.user.id, date);
  return jsonData({ workouts: rows.map(workoutRowToWire) });
}

export async function POST(request: Request) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const body = await readJsonZod(request, entryPostBodySchema);
  if (body instanceof Response) return body;

  const row = await insertWorkout({
    userId: session.user.id,
    entryDate: body.date,
    calories: body.calories,
  });
  if (!row) {
    return jsonData({ error: "Insert failed" }, 500);
  }
  return jsonData({ workout: workoutRowToWire(row) }, 201);
}
