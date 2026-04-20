import {
  boolean,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  googleSub: text("google_sub").notNull().unique(),
  email: text("email").notNull().unique(),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  /** One-time local→cloud migration prompt completed (migrated, declined, or no local data). */
  migrationCompleted: boolean("migration_completed").notNull().default(false),
});

const entryTimestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
};

export const mealEntries = pgTable(
  "meal_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Calendar day in local yyyy-mm-dd (same convention as the app). */
    entryDate: text("entry_date").notNull(),
    calories: integer("calories").notNull(),
    /** Sort key within a day; not rewritten when other rows are deleted. */
    displayOrder: integer("display_order").notNull(),
    ...entryTimestamps,
  },
  (table) => [
    index("meal_entries_user_id_entry_date_idx").on(
      table.userId,
      table.entryDate,
    ),
  ],
);

export const workoutEntries = pgTable(
  "workout_entries",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    entryDate: text("entry_date").notNull(),
    calories: integer("calories").notNull(),
    displayOrder: integer("display_order").notNull(),
    ...entryTimestamps,
  },
  (table) => [
    index("workout_entries_user_id_entry_date_idx").on(
      table.userId,
      table.entryDate,
    ),
  ],
);

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  bmrKcal: integer("bmr_kcal").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type MealEntryRow = typeof mealEntries.$inferSelect;
export type WorkoutEntryRow = typeof workoutEntries.$inferSelect;
export type UserSettingsRow = typeof userSettings.$inferSelect;
