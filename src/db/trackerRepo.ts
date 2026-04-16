import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import { getDb } from "./client";
import { mealEntries, workoutEntries } from "./schema";

export async function listAllMealsForUser(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(mealEntries)
    .where(eq(mealEntries.userId, userId))
    .orderBy(asc(mealEntries.entryDate), asc(mealEntries.displayOrder));
}

export async function listAllWorkoutsForUser(userId: string) {
  const db = getDb();
  return db
    .select()
    .from(workoutEntries)
    .where(eq(workoutEntries.userId, userId))
    .orderBy(asc(workoutEntries.entryDate), asc(workoutEntries.displayOrder));
}

export async function nextMealDisplayOrder(
  userId: string,
  entryDate: string,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({ m: sql<number>`coalesce(max(${mealEntries.displayOrder}), 0)` })
    .from(mealEntries)
    .where(
      and(eq(mealEntries.userId, userId), eq(mealEntries.entryDate, entryDate)),
    );
  return Number(row?.m ?? 0) + 1;
}

export async function nextWorkoutDisplayOrder(
  userId: string,
  entryDate: string,
): Promise<number> {
  const db = getDb();
  const [row] = await db
    .select({
      m: sql<number>`coalesce(max(${workoutEntries.displayOrder}), 0)`,
    })
    .from(workoutEntries)
    .where(
      and(
        eq(workoutEntries.userId, userId),
        eq(workoutEntries.entryDate, entryDate),
      ),
    );
  return Number(row?.m ?? 0) + 1;
}

export async function listMealsForDate(userId: string, entryDate: string) {
  const db = getDb();
  return db
    .select()
    .from(mealEntries)
    .where(
      and(eq(mealEntries.userId, userId), eq(mealEntries.entryDate, entryDate)),
    )
    .orderBy(asc(mealEntries.displayOrder));
}

export async function listWorkoutsForDate(userId: string, entryDate: string) {
  const db = getDb();
  return db
    .select()
    .from(workoutEntries)
    .where(
      and(
        eq(workoutEntries.userId, userId),
        eq(workoutEntries.entryDate, entryDate),
      ),
    )
    .orderBy(asc(workoutEntries.displayOrder));
}

export async function insertMeal(params: {
  userId: string;
  entryDate: string;
  calories: number;
  displayOrder: number;
}) {
  const db = getDb();
  const [row] = await db
    .insert(mealEntries)
    .values({
      userId: params.userId,
      entryDate: params.entryDate,
      calories: params.calories,
      displayOrder: params.displayOrder,
    })
    .returning();
  return row;
}

export async function insertWorkout(params: {
  userId: string;
  entryDate: string;
  calories: number;
  displayOrder: number;
}) {
  const db = getDb();
  const [row] = await db
    .insert(workoutEntries)
    .values({
      userId: params.userId,
      entryDate: params.entryDate,
      calories: params.calories,
      displayOrder: params.displayOrder,
    })
    .returning();
  return row;
}

export async function updateMealCalories(
  userId: string,
  mealId: string,
  calories: number,
) {
  const db = getDb();
  const [row] = await db
    .update(mealEntries)
    .set({ calories, updatedAt: new Date() })
    .where(and(eq(mealEntries.id, mealId), eq(mealEntries.userId, userId)))
    .returning();
  return row ?? null;
}

export async function updateWorkoutCalories(
  userId: string,
  workoutId: string,
  calories: number,
) {
  const db = getDb();
  const [row] = await db
    .update(workoutEntries)
    .set({ calories, updatedAt: new Date() })
    .where(
      and(eq(workoutEntries.id, workoutId), eq(workoutEntries.userId, userId)),
    )
    .returning();
  return row ?? null;
}

export async function deleteMeal(userId: string, mealId: string) {
  const db = getDb();
  const [row] = await db
    .delete(mealEntries)
    .where(and(eq(mealEntries.id, mealId), eq(mealEntries.userId, userId)))
    .returning({ id: mealEntries.id });
  return row ?? null;
}

export async function deleteWorkout(userId: string, workoutId: string) {
  const db = getDb();
  const [row] = await db
    .delete(workoutEntries)
    .where(
      and(eq(workoutEntries.id, workoutId), eq(workoutEntries.userId, userId)),
    )
    .returning({ id: workoutEntries.id });
  return row ?? null;
}

export async function mealTotalsByDateInRange(
  userId: string,
  startDate: string,
  endDate: string,
) {
  const db = getDb();
  return db
    .select({
      date: mealEntries.entryDate,
      caloriesSum: sql<number>`coalesce(sum(${mealEntries.calories}), 0)`.mapWith(
        Number,
      ),
      rowCount: sql<number>`count(*)::int`.mapWith(Number),
    })
    .from(mealEntries)
    .where(
      and(
        eq(mealEntries.userId, userId),
        gte(mealEntries.entryDate, startDate),
        lte(mealEntries.entryDate, endDate),
      ),
    )
    .groupBy(mealEntries.entryDate);
}

export async function workoutTotalsByDateInRange(
  userId: string,
  startDate: string,
  endDate: string,
) {
  const db = getDb();
  return db
    .select({
      date: workoutEntries.entryDate,
      caloriesSum: sql<number>`coalesce(sum(${workoutEntries.calories}), 0)`.mapWith(
        Number,
      ),
      rowCount: sql<number>`count(*)::int`.mapWith(Number),
    })
    .from(workoutEntries)
    .where(
      and(
        eq(workoutEntries.userId, userId),
        gte(workoutEntries.entryDate, startDate),
        lte(workoutEntries.entryDate, endDate),
      ),
    )
    .groupBy(workoutEntries.entryDate);
}

export async function replaceAllTrackerEntries(params: {
  userId: string;
  meals: { entryDate: string; calories: number; displayOrder: number }[];
  workouts: { entryDate: string; calories: number; displayOrder: number }[];
}) {
  const db = getDb();
  await db.transaction(async (tx) => {
    await tx.delete(mealEntries).where(eq(mealEntries.userId, params.userId));
    await tx
      .delete(workoutEntries)
      .where(eq(workoutEntries.userId, params.userId));
    if (params.meals.length) {
      await tx.insert(mealEntries).values(
        params.meals.map((m) => ({
          userId: params.userId,
          entryDate: m.entryDate,
          calories: m.calories,
          displayOrder: m.displayOrder,
        })),
      );
    }
    if (params.workouts.length) {
      await tx.insert(workoutEntries).values(
        params.workouts.map((w) => ({
          userId: params.userId,
          entryDate: w.entryDate,
          calories: w.calories,
          displayOrder: w.displayOrder,
        })),
      );
    }
  });
}
