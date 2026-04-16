/** Client + API wire shape for a logged meal or workout line (matches persisted rows minus DB timestamps). */
export type TrackerEntryWire = {
  id: string;
  date: string;
  calories: number;
  displayOrder: number;
};

/** Keys for persisted tracker entries (localStorage and JSON backups). */
export const TRACKER_ENTRY_WIRE_KEYS = [
  "id",
  "date",
  "calories",
  "displayOrder",
] as const;

export type DailySummaryWire = {
  date: string;
  bmr: number;
  meals: TrackerEntryWire[];
  workouts: TrackerEntryWire[];
  consumed: number;
  burned: number;
  net: number;
};

export type CalendarDayWire = {
  date: string;
  net: number;
  hasActivity: boolean;
};

export type UserSettingsWire = {
  bmrKcal: number;
};
