import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { userSettings } from "./schema";

export const DEFAULT_BMR_KCAL = 2000;

export async function getBmrForUser(userId: string): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ bmrKcal: userSettings.bmrKcal })
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);
  if (!row) return DEFAULT_BMR_KCAL;
  return row.bmrKcal;
}

export async function upsertBmr(userId: string, bmrKcal: number) {
  const db = getDb();
  const now = new Date();
  const [row] = await db
    .insert(userSettings)
    .values({
      userId,
      bmrKcal,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: userSettings.userId,
      set: { bmrKcal, updatedAt: now },
    })
    .returning();
  return row;
}
