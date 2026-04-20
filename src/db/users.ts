import { eq } from "drizzle-orm";
import { getDb } from "./client";
import { users } from "./schema";

export async function upsertGoogleUser(params: {
  googleSub: string;
  email: string;
  name: string | null;
  image: string | null;
}): Promise<{ id: string }> {
  const db = getDb();
  const id = crypto.randomUUID();
  const [row] = await db
    .insert(users)
    .values({
      id,
      googleSub: params.googleSub,
      email: params.email,
      name: params.name,
      image: params.image,
    })
    .onConflictDoUpdate({
      target: users.googleSub,
      set: {
        email: params.email,
        name: params.name,
        image: params.image,
        updatedAt: new Date(),
      },
    })
    .returning({ id: users.id });

  if (!row) {
    throw new Error("upsertGoogleUser: no row returned");
  }
  return row;
}

export async function deleteUserById(userId: string): Promise<void> {
  const db = getDb();
  await db.delete(users).where(eq(users.id, userId));
}

export async function setMigrationCompleted(
  userId: string,
  completed: boolean,
): Promise<void> {
  const db = getDb();
  await db
    .update(users)
    .set({ migrationCompleted: completed, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function getMigrationCompleted(userId: string): Promise<boolean> {
  const db = getDb();
  const [row] = await db
    .select({ migrationCompleted: users.migrationCompleted })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  return row?.migrationCompleted ?? false;
}
