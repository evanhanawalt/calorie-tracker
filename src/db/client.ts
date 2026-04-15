import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

function connectionString(): string {
  const url = import.meta.env.DATABASE_URL ?? process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set");
  }
  return url;
}

let db: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!db) {
    db = drizzle(neon(connectionString()), { schema });
  }
  return db;
}
