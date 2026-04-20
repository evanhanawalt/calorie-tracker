import { upsertBmr } from "@/db/userSettingsRepo";
import {
  countTrackerRowsForUser,
  replaceAllTrackerEntries,
} from "@/db/trackerRepo";
import { setMigrationCompleted } from "@/db/users";
import { jsonData, jsonError, readJsonZod } from "@/lib/api/routeHttp";
import { requireSession } from "@/lib/auth/readSession";
import { migrationPostBodySchema } from "@/lib/schemas/me";

export const dynamic = "force-dynamic";

const MAX_BODY_BYTES = 2 * 1024 * 1024;

export async function POST(request: Request) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const len = request.headers.get("content-length");
  if (len !== null && Number(len) > MAX_BODY_BYTES) {
    return jsonError("Payload too large", 413);
  }

  const parsed = await readJsonZod(request, migrationPostBodySchema);
  if (parsed instanceof Response) return parsed;

  const counts = await countTrackerRowsForUser(session.user.id);
  const hasCloud =
    counts.meals > 0 || counts.workouts > 0;
  if (hasCloud && !parsed.confirmReplaceExisting) {
    return jsonError(
      "Your account already has tracker data. Confirm replace to overwrite.",
      409,
    );
  }

  await replaceAllTrackerEntries({
    userId: session.user.id,
    meals: parsed.meals.map((m) => ({
      entryDate: m.date,
      calories: m.calories,
      displayOrder: m.displayOrder,
    })),
    workouts: parsed.workouts.map((w) => ({
      entryDate: w.date,
      calories: w.calories,
      displayOrder: w.displayOrder,
    })),
  });
  await upsertBmr(session.user.id, parsed.bmrKcal);
  await setMigrationCompleted(session.user.id, true);

  return jsonData({ ok: true as const });
}
