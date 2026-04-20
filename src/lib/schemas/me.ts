import { z } from "zod";
import { isoDateStringSchema } from "./tracker";

export const mePatchBodySchema = z.object({
  migrationCompleted: z.literal(true),
});

export const migrationPostBodySchema = z.object({
  bmrKcal: z.number().int().min(500).max(20000),
  meals: z.array(
    z.object({
      date: isoDateStringSchema,
      calories: z
        .number()
        .finite()
        .transform((n) => Math.max(0, Math.round(n))),
      displayOrder: z.number().int().min(1),
    }),
  ),
  workouts: z.array(
    z.object({
      date: isoDateStringSchema,
      calories: z
        .number()
        .finite()
        .transform((n) => Math.max(0, Math.round(n))),
      displayOrder: z.number().int().min(1),
    }),
  ),
  confirmReplaceExisting: z.boolean().optional(),
});
