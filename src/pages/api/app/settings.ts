import type { APIRoute } from "astro";
import { getBmrForUser, upsertBmr } from "../../../db/userSettingsRepo";
import type { UserSettingsWire } from "../../../lib/trackerWire";

export const prerender = false;

export const GET: APIRoute = async ({ locals }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  const bmrKcal = await getBmrForUser(session.user.id);
  const body: UserSettingsWire = { bmrKcal };
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
};

export const PATCH: APIRoute = async ({ locals, request }) => {
  const session = locals.session;
  if (!session?.user?.id) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return new Response(JSON.stringify({ error: "Invalid JSON" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  if (!payload || typeof payload !== "object") {
    return new Response(JSON.stringify({ error: "Invalid body" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const bmrKcal = (payload as { bmrKcal?: unknown }).bmrKcal;
  if (typeof bmrKcal !== "number" || !Number.isFinite(bmrKcal)) {
    return new Response(JSON.stringify({ error: "bmrKcal must be a number" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }
  const rounded = Math.round(bmrKcal);
  if (rounded < 500 || rounded > 20000) {
    return new Response(
      JSON.stringify({ error: "bmrKcal must be between 500 and 20000" }),
      { status: 400, headers: { "Content-Type": "application/json" } },
    );
  }
  await upsertBmr(session.user.id, rounded);
  const body: UserSettingsWire = { bmrKcal: rounded };
  return new Response(JSON.stringify(body), {
    headers: { "Content-Type": "application/json" },
  });
};
