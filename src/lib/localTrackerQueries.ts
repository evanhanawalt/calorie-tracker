import { listIsoDatesInclusive } from "@/lib/calendarGrid";
import {
  groupedByDate,
  loadBmr,
  loadFoodEntries,
  loadWorkoutEntries,
  sumCalories,
} from "@/lib/calorieTrackerStorage";
import type { CalendarDayWire, DailySummaryWire } from "@/lib/trackerWire";

/** Build the same wire shape as `GET /api/app/tracker/summary` from localStorage. */
export function getLocalDailySummary(date: string): DailySummaryWire {
  const food = loadFoodEntries();
  const wo = loadWorkoutEntries();
  const bmr = loadBmr();
  const foodByDate = groupedByDate(food);
  const woByDate = groupedByDate(wo);
  const meals = foodByDate[date] ?? [];
  const workouts = woByDate[date] ?? [];
  const consumed = sumCalories(meals);
  const burned = sumCalories(workouts);
  return {
    date,
    bmr,
    meals,
    workouts,
    consumed,
    burned,
    netConsumed: consumed - burned,
  };
}

/** Build the same wire shape as `GET /api/app/tracker/calendar` from localStorage. */
export function getLocalCalendarDays(
  start: string,
  end: string,
): CalendarDayWire[] {
  const food = loadFoodEntries();
  const wo = loadWorkoutEntries();
  const foodByDate = groupedByDate(food);
  const woByDate = groupedByDate(wo);
  const days = listIsoDatesInclusive(start, end);
  return days.map((date) => {
    const meals = foodByDate[date] ?? [];
    const workouts = woByDate[date] ?? [];
    const consumed = sumCalories(meals);
    const burned = sumCalories(workouts);
    return {
      date,
      netConsumed: consumed - burned,
      hasActivity: meals.length > 0 || workouts.length > 0,
    };
  });
}
