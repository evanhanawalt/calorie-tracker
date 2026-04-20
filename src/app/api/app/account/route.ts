import { deleteUserById } from "@/db/users";
import { jsonData } from "@/lib/api/routeHttp";
import { requireSession } from "@/lib/auth/readSession";

export const dynamic = "force-dynamic";

export async function DELETE(request: Request) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;

  await deleteUserById(session.user.id);
  return jsonData({ ok: true as const });
}
