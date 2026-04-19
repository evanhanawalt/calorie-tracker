import { z } from "zod";

/** yyyy-mm-dd (lexicographic compare matches calendar order). */
export const isoDateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Must be yyyy-mm-dd");

/** Meal/workout row id from Postgres `uuid` column. */
export const routeUuidSchema = z
  .string()
  .regex(
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    "Invalid id",
  );

export const trackerEntryWireSchema = z
  .object({
    id: z.string().min(1),
    date: isoDateStringSchema,
    calories: z.number().finite().transform((n) => Math.max(0, Math.round(n))),
    displayOrder: z.number().int().min(1),
  })
  .strict();

export const dailySummaryWireSchema = z.object({
  date: isoDateStringSchema,
  bmr: z.number().finite(),
  meals: z.array(trackerEntryWireSchema),
  workouts: z.array(trackerEntryWireSchema),
  consumed: z.number().finite(),
  burned: z.number().finite(),
  net: z.number().finite(),
});

export const calendarDayWireSchema = z.object({
  date: isoDateStringSchema,
  net: z.number().finite(),
  hasActivity: z.boolean(),
});

export const userSettingsWireSchema = z.object({
  bmrKcal: z.number().finite().int(),
});

export const entryPostBodySchema = z.object({
  date: isoDateStringSchema,
  calories: z
    .number({ invalid_type_error: "Invalid calories" })
    .finite()
    .min(0, "Invalid calories")
    .transform((n) => Math.round(n)),
});

export const caloriesPatchBodySchema = z.object({
  calories: z
    .number({ invalid_type_error: "Invalid calories" })
    .finite()
    .min(0, "Invalid calories")
    .transform((n) => Math.round(n)),
});

export const bmrPatchBodySchema = z
  .object({
    bmrKcal: z.number({ invalid_type_error: "bmrKcal must be a number" }).finite(),
  })
  .transform(({ bmrKcal }) => ({ bmrKcal: Math.round(bmrKcal) }))
  .pipe(
    z.object({
      bmrKcal: z
        .number()
        .int()
        .min(500, { message: "bmrKcal must be between 500 and 20000" })
        .max(20000, { message: "bmrKcal must be between 500 and 20000" }),
    }),
  );

export const apiErrorBodySchema = z.object({
  error: z.string(),
});

export const mealsListResponseSchema = z.object({
  meals: z.array(trackerEntryWireSchema),
});

export const workoutsListResponseSchema = z.object({
  workouts: z.array(trackerEntryWireSchema),
});

export const mealMutationResponseSchema = z.object({
  meal: trackerEntryWireSchema,
});

export const workoutMutationResponseSchema = z.object({
  workout: trackerEntryWireSchema,
});

export const deleteOkResponseSchema = z.object({
  ok: z.literal(true),
});

export const calendarDaysResponseSchema = z.object({
  days: z.array(calendarDayWireSchema),
});

export const isoDateRangeQuerySchema = z
  .object({
    start: isoDateStringSchema,
    end: isoDateStringSchema,
  })
  .refine((v) => v.start <= v.end, {
    message: "start must be <= end",
    path: ["end"],
  });

export type TrackerEntryWire = z.infer<typeof trackerEntryWireSchema>;
export type DailySummaryWire = z.infer<typeof dailySummaryWireSchema>;
export type CalendarDayWire = z.infer<typeof calendarDayWireSchema>;
export type UserSettingsWire = z.infer<typeof userSettingsWireSchema>;
