import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { users } from "./schema";
import { createPgliteWithMigrations, type TestDb } from "../test/pgliteDb";

const testDbState = vi.hoisted(() => {
  let db: TestDb | null = null;
  return {
    setDb(next: TestDb) {
      db = next;
    },
    getDb(): TestDb {
      if (!db) throw new Error("test DB not initialized");
      return db;
    },
  };
});

vi.mock("./client", () => ({
  getDb: () => testDbState.getDb(),
}));

import {
  deleteMeal,
  insertMeal,
  insertWorkout,
  listMealsForDate,
  listWorkoutsForDate,
  updateMealCalories,
} from "./trackerRepo";

let closePglite: (() => Promise<void>) | undefined;

describe("trackerRepo (PGlite)", () => {
  const userId = "test-user-repo";

  beforeAll(async () => {
    const { pg, db } = await createPgliteWithMigrations();
    testDbState.setDb(db);
    closePglite = () => pg.close();
    await db.insert(users).values({
      id: userId,
      googleSub: "sub-test-repo",
      email: "repo-test@example.com",
      name: null,
      image: null,
    });
  });

  afterAll(async () => {
    if (closePglite) await closePglite();
  });

  it("insertMeal assigns increasing displayOrder and listMealsForDate orders by it", async () => {
    const date = "2024-08-01";
    const a = await insertMeal({
      userId,
      entryDate: date,
      calories: 100,
    });
    const b = await insertMeal({
      userId,
      entryDate: date,
      calories: 200,
    });
    expect(a?.displayOrder).toBe(1);
    expect(b?.displayOrder).toBe(2);

    const rows = await listMealsForDate(userId, date);
    expect(rows.map((r) => r.calories)).toEqual([100, 200]);
  });

  it("updateMealCalories updates row for user", async () => {
    const date = "2024-08-02";
    const row = await insertMeal({
      userId,
      entryDate: date,
      calories: 50,
    });
    expect(row).toBeDefined();
    const updated = await updateMealCalories(
      userId,
      row!.id,
      75,
    );
    expect(updated?.calories).toBe(75);
  });

  it("deleteMeal removes row", async () => {
    const date = "2024-08-03";
    const row = await insertMeal({
      userId,
      entryDate: date,
      calories: 10,
    });
    const del = await deleteMeal(userId, row!.id);
    expect(del?.id).toBe(row!.id);
    const remaining = await listMealsForDate(userId, date);
    expect(remaining).toHaveLength(0);
  });

  it("insertWorkout and listWorkoutsForDate mirror meal ordering", async () => {
    const date = "2024-08-04";
    await insertWorkout({ userId, entryDate: date, calories: 50 });
    await insertWorkout({ userId, entryDate: date, calories: 60 });
    const rows = await listWorkoutsForDate(userId, date);
    expect(rows.map((r) => r.calories)).toEqual([50, 60]);
  });
});
