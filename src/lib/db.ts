import { neon, type NeonQueryFunction } from "@neondatabase/serverless";

/**
 * Neon over HTTP — fits Vercel serverless (no long-lived TCP pool required).
 * For high concurrency, prefer a pooled connection string (`-pooler` in the host).
 * @see https://neon.com/docs/connect/connection-pooling
 */
function connectionString(): string {
  const url = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

let sql: NeonQueryFunction<false, false> | undefined;

export function getSql(): NeonQueryFunction<false, false> {
  if (!sql) {
    sql = neon(connectionString());
  }
  return sql;
}
