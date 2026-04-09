import type { APIRoute } from "astro";
import { getSql } from "../../lib/db";

/** Verifies Neon connectivity; use while wiring deploy + env on Vercel. */
export const GET: APIRoute = async () => {
  try {
    const sql = getSql();
    const [row] = await sql`SELECT 1 AS n`;
    const n = typeof row?.n === "number" ? row.n : null;
    return new Response(
      JSON.stringify({ ok: true, db: n === 1 ? "up" : "unexpected" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    );
  } catch (err) {
    console.error(err);
    return new Response(
      JSON.stringify({
        ok: false,
        error: err instanceof Error ? err.message : "unknown error",
      }),
      {
        status: 503,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
};
