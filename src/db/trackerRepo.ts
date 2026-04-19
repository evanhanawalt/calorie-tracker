import { and, asc, eq, gte, lte, sql } from "drizzle-orm";
import type { PgInsertSelectQueryBuilder } from "drizzle-orm/pg-core/query-builders/insert";
import { getDb } from "./client";
import {
  mealEntries,
  workoutEntries,
  type MealEntryRow,
  type WorkoutEntryRow,
} from "./schema";

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

type InsertEntryParams = {
  userId: string;
  entryDate: string;
  calories: number;
};

export async function insertMeal(
  params: InsertEntryParams,
): Promise<MealEntryRow | undefined> {
  const db = getDb();
  const next = db.$with("next").as((qb) =>
    qb
      .select({
        displayOrder: sql<number>`coalesce(max(${mealEntries.displayOrder}), 0) + 1`.as(
          "display_order",
        ),
      })
      .from(mealEntries)
      .where(
        and(
          eq(mealEntries.userId, params.userId),
          eq(mealEntries.entryDate, params.entryDate),
        ),
      ),
  );

  const [row] = await db
    .with(next)
    .insert(mealEntries)
    .select((qb) =>
      qb
        .select({
          id: sql<string>`gen_random_uuid()`.as(mealEntries.id.name),
          userId: sql<string>`${params.userId}`.as(mealEntries.userId.name),
          entryDate: sql<string>`${params.entryDate}`.as(mealEntries.entryDate.name),
          calories: sql<number>`${params.calories}`.as(mealEntries.calories.name),
          displayOrder: next.displayOrder,
          createdAt: sql<Date>`now()`.as(mealEntries.createdAt.name),
          updatedAt: sql<Date>`now()`.as(mealEntries.updatedAt.name),
        })
        // drizzle-orm insert().select() expects PgInsertSelectQueryBuilder; qb.select() is typed as PgSelectQueryBuilderBase (same SQL at runtime).
        .from(next) as PgInsertSelectQueryBuilder<typeof mealEntries>,
    )
    .returning();

  return row;
}

export async function insertWorkout(
  params: InsertEntryParams,
): Promise<WorkoutEntryRow | undefined> {
  const db = getDb();
  const next = db.$with("next").as((qb) =>
    qb
      .select({
        displayOrder: sql<number>`coalesce(max(${workoutEntries.displayOrder}), 0) + 1`.as(
          "display_order",
        ),
      })
      .from(workoutEntries)
      .where(
        and(
          eq(workoutEntries.userId, params.userId),
          eq(workoutEntries.entryDate, params.entryDate),
        ),
      ),
  );

  const [row] = await db
    .with(next)
    .insert(workoutEntries)
    .select((qb) =>
      qb
        .select({
          id: sql<string>`gen_random_uuid()`.as(workoutEntries.id.name),
          userId: sql<string>`${params.userId}`.as(workoutEntries.userId.name),
          entryDate: sql<string>`${params.entryDate}`.as(workoutEntries.entryDate.name),
          calories: sql<number>`${params.calories}`.as(workoutEntries.calories.name),
          displayOrder: next.displayOrder,
          createdAt: sql<Date>`now()`.as(workoutEntries.createdAt.name),
          updatedAt: sql<Date>`now()`.as(workoutEntries.updatedAt.name),
        })
        // drizzle-orm insert().select() expects PgInsertSelectQueryBuilder; qb.select() is typed as PgSelectQueryBuilderBase (same SQL at runtime).
        .from(next) as PgInsertSelectQueryBuilder<typeof workoutEntries>,
    )
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
