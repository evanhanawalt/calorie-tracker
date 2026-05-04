import { PGlite } from "@electric-sql/pglite";
import { readdir, readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { drizzle } from "drizzle-orm/pglite";
import * as schema from "@/db/schema";

const projectRoot = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "..",
);

export type TestDb = ReturnType<typeof drizzle<typeof schema>>;

/**
 * In-memory Postgres + Drizzle, with the same migration SQL as `drizzle/*.sql`.
 */
export async function createPgliteWithMigrations(): Promise<{
  pg: PGlite;
  db: TestDb;
}> {
  const pg = new PGlite();
  const drizzleDir = join(projectRoot, "drizzle");
  const files = (await readdir(drizzleDir))
    .filter((f) => f.endsWith(".sql"))
    .sort();
  for (const file of files) {
    const content = await readFile(join(drizzleDir, file), "utf-8");
    const statements = content
      .split("--> statement-breakpoint")
      .map((s) => s.trim())
      .filter(Boolean);
    for (const stmt of statements) {
      await pg.exec(stmt);
    }
  }
  const db = drizzle(pg, { schema });
  return { pg, db };
}
