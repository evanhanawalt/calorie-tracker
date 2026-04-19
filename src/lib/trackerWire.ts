/** Keys for persisted tracker entries (localStorage). */
export const TRACKER_ENTRY_WIRE_KEYS = [
  "id",
  "date",
  "calories",
  "displayOrder",
] as const;

export type {
  CalendarDayWire,
  DailySummaryWire,
  TrackerEntryWire,
  UserSettingsWire,
} from "./schemas/tracker";

export {
  apiErrorBodySchema,
  bmrPatchBodySchema,
  calendarDayWireSchema,
  calendarDaysResponseSchema,
  caloriesPatchBodySchema,
  dailySummaryWireSchema,
  deleteOkResponseSchema,
  entryPostBodySchema,
  ISO_DATE_RANGE_MAX_INCLUSIVE_DAYS,
  isoDateRangeQuerySchema,
  isoDateStringSchema,
  mealMutationResponseSchema,
  mealsListResponseSchema,
  routeUuidSchema,
  trackerEntryWireSchema,
  userSettingsWireSchema,
  workoutMutationResponseSchema,
  workoutsListResponseSchema,
} from "./schemas/tracker";
