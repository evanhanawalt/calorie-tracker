import { getMigrationCompleted, setMigrationCompleted } from "@/db/users";
import { jsonData, readJsonZod } from "@/lib/api/routeHttp";
import { requireSession } from "@/lib/auth/readSession";
import { mePatchBodySchema } from "@/lib/schemas/me";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const migrationCompleted = await getMigrationCompleted(session.user.id);
  return jsonData({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
    migrationCompleted,
  });
}

export async function PATCH(request: Request) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  const parsed = await readJsonZod(request, mePatchBodySchema);
  if (parsed instanceof Response) return parsed;

  await setMigrationCompleted(session.user.id, parsed.migrationCompleted);
  return jsonData({ migrationCompleted: true });
}
