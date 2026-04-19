import { getBmrForUser, upsertBmr } from "@/db/userSettingsRepo";
import { jsonData, readJsonZod } from "@/lib/api/routeHttp";
import { requireSession } from "@/lib/auth/readSession";
import { bmrPatchBodySchema } from "@/lib/trackerWire";
import type { UserSettingsWire } from "@/lib/trackerWire";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const bmrKcal = await getBmrForUser(session.user.id);
  const body: UserSettingsWire = { bmrKcal };
  return jsonData(body);
}

export async function PATCH(request: Request) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const parsed = await readJsonZod(request, bmrPatchBodySchema);
  if (parsed instanceof Response) return parsed;

  await upsertBmr(session.user.id, parsed.bmrKcal);
  const body: UserSettingsWire = { bmrKcal: parsed.bmrKcal };
  return jsonData(body);
}
