import { Auth } from "@auth/core";
import type { Session } from "@auth/core/types";
import { jsonError } from "@/lib/api/routeHttp";
import { authConfig } from "./auth.config";
import { sessionUrlForOrigin } from "./authPaths";

/**
 * In-process session read (no HTTP self-fetch). Builds a synthetic GET to
 * `/api/auth/session` and runs the same `Auth()` handler as the catch-all route.
 */
export async function readSession(request: Request): Promise<Session | null> {
  const origin = new URL(request.url).origin;
  const sessionRequest = new Request(sessionUrlForOrigin(origin), {
    method: "GET",
    headers: {
      cookie: request.headers.get("cookie") ?? "",
    },
  });
  const response = await Auth(sessionRequest, authConfig);
  if (!response.ok) {
    return null;
  }
  const text = await response.text();
  if (!text) {
    return null;
  }
  try {
    const data = JSON.parse(text) as Session | null;
    if (!data || typeof data !== "object" || !data.user) {
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

export async function requireSession(
  request: Request,
): Promise<Session | Response> {
  const session = await readSession(request);
  if (!session?.user?.id) {
    return jsonError("Unauthorized", 401);
  }
  return session;
}
