import { jsonData } from "@/lib/api/routeHttp";
import { getSql } from "@/lib/db";

export const dynamic = "force-dynamic";

/** Verifies Neon connectivity; use while wiring deploy + env on Vercel. */
export async function GET() {
  try {
    const sql = getSql();
    const [row] = await sql`SELECT 1 AS n`;
    const n = typeof row?.n === "number" ? row.n : null;
    return jsonData({ ok: true, db: n === 1 ? "up" : "unexpected" });
  } catch (err) {
    console.error(err);
    return jsonData(
      { ok: false, error: "Database connection failed" },
      503,
    );
  }
}
