import { deleteMeal, updateMealCalories } from "@/db/trackerRepo";
import { jsonData, parseUuidRouteParam, readJsonZod } from "@/lib/api/routeHttp";
import { requireSession } from "@/lib/auth/readSession";
import { caloriesPatchBodySchema } from "@/lib/trackerWire";
import { mealRowToWire } from "@/lib/trackerWireMappers";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const id = await parseUuidRouteParam(context);
  if (id instanceof Response) return id;

  const body = await readJsonZod(request, caloriesPatchBodySchema);
  if (body instanceof Response) return body;

  const row = await updateMealCalories(session.user.id, id, body.calories);
  if (!row) {
    return jsonData({ error: "Not found" }, 404);
  }
  return jsonData({ meal: mealRowToWire(row) });
}

export async function DELETE(request: Request, context: RouteContext) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const id = await parseUuidRouteParam(context);
  if (id instanceof Response) return id;

  const row = await deleteMeal(session.user.id, id);
  if (!row) {
    return jsonData({ error: "Not found" }, 404);
  }
  return jsonData({ ok: true });
}
