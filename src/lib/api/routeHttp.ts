import {
  isoDateRangeQuerySchema,
  isoDateStringSchema,
  routeUuidSchema,
} from "@/lib/trackerWire";
import type { z } from "zod";

const JSON_HEADERS = { "Content-Type": "application/json" } as const;

function firstZodMessage(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Invalid input";
}

export async function readJsonZod<T>(
  request: Request,
  schema: z.ZodType<T>,
): Promise<T | Response> {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return jsonError("Invalid JSON", 400);
  }
  const result = schema.safeParse(raw);
  if (!result.success) {
    return jsonError(firstZodMessage(result.error), 400);
  }
  return result.data;
}

export function jsonData(data: unknown, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: JSON_HEADERS,
  });
}

export function jsonError(message: string, status: number): Response {
  return jsonData({ error: message }, status);
}

/**
 * Resolve "today" as a local calendar date (yyyy-mm-dd), matching the app's
 * date semantics used by the client.
 */
export function localTodayIso(now = new Date()): string {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function requireIsoDateQuery(
  request: Request,
  paramName: string,
): string | Response {
  const url = new URL(request.url);
  const v = url.searchParams.get(paramName);
  const result = isoDateStringSchema.safeParse(v);
  if (!result.success) {
    return jsonError(firstZodMessage(result.error), 400);
  }
  return result.data;
}

export function requireIsoDateRange(
  request: Request,
): { start: string; end: string } | Response {
  const url = new URL(request.url);
  const result = isoDateRangeQuerySchema.safeParse({
    start: url.searchParams.get("start"),
    end: url.searchParams.get("end"),
  });
  if (!result.success) {
    return jsonError(firstZodMessage(result.error), 400);
  }
  return result.data;
}

export async function parseUuidRouteParam(
  context: { params: Promise<{ id: string }> },
): Promise<string | Response> {
  const { id } = await context.params;
  const result = routeUuidSchema.safeParse(id);
  if (!result.success) {
    return jsonError("Invalid id", 400);
  }
  return result.data;
}
