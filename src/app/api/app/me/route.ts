import { jsonData } from "@/lib/api/routeHttp";
import { requireSession } from "@/lib/auth/readSession";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const sessionOrResponse = await requireSession(request);
  if (sessionOrResponse instanceof Response) return sessionOrResponse;
  const session = sessionOrResponse;
  return jsonData({
    userId: session.user.id,
    email: session.user.email,
    name: session.user.name,
  });
}
