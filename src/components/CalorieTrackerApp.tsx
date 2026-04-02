import { useEffect, useId, useRef, useState } from "react";
import {
  entryItemLabel,
  formatDateForDisplay,
  getLocalTodayIso,
  getNextCount,
  groupedByDate,
  loadFoodEntries,
  loadWorkoutEntries,
  saveEntries,
  sanitizeEntries,
  sumCalories,
  type Entry,
} from "../lib/calorieTrackerStorage";

export default function CalorieTrackerApp() {
  const [foodEntries, setFoodEntries] = useState<Entry[]>(() => loadFoodEntries());
  const [workoutEntries, setWorkoutEntries] = useState<Entry[]>(() => loadWorkoutEntries());
  const [foodDate, setFoodDate] = useState(() => getLocalTodayIso());
  const [workoutDate, setWorkoutDate] = useState(() => getLocalTodayIso());
  const [foodCalories, setFoodCalories] = useState("");
  const [workoutCalories, setWorkoutCalories] = useState("");
  const [statusMessage, setStatusMessage] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [backupMenuOpen, setBackupMenuOpen] = useState(false);

  const backupMenuRef = useRef<HTMLDivElement>(null);
  const backupMenuButtonRef = useRef<HTMLButtonElement>(null);
  const backupMenuHeadingId = useId();

  function setStatus(message: string, isError = false) {
    setStatusMessage(message);
    setStatusIsError(isError);
  }

  function onFoodSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const date = foodDate;
    const calories = Number(foodCalories);
    if (!date || !Number.isFinite(calories) || calories < 0) {
      setStatus("Please enter a valid meal date and calories.", true);
      return;
    }
    const nextCount = getNextCount(foodEntries, date);
    const roundCal = Math.round(calories);
    const nextFood = [...foodEntries, { date, calories: roundCal, count: nextCount }];
    setFoodEntries(nextFood);
    saveEntries(nextFood, workoutEntries);
    setFoodCalories("");
    const today = getLocalTodayIso();
    setFoodDate(today);
    setWorkoutDate(today);
    setStatus("Meal added.");
  }

  function onWorkoutSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const date = workoutDate;
    const calories = Number(workoutCalories);
    if (!date || !Number.isFinite(calories) || calories < 0) {
      setStatus("Please enter a valid workout date and calories.", true);
      return;
    }
    const nextCount = getNextCount(workoutEntries, date);
    const roundCal = Math.round(calories);
    const nextWorkouts = [...workoutEntries, { date, calories: roundCal, count: nextCount }];
    setWorkoutEntries(nextWorkouts);
    saveEntries(foodEntries, nextWorkouts);
    setWorkoutCalories("");
    const today = getLocalTodayIso();
    setFoodDate(today);
    setWorkoutDate(today);
    setStatus("Workout added.");
  }

  function onDownloadBackup() {
    const payload = {
      foodEntries,
      workoutEntries,
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `calorie-tracker-backup-${getLocalTodayIso()}.json`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Backup downloaded.");
  }

  async function onUploadBackupChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const parsed = JSON.parse(text) as { foodEntries?: unknown; workoutEntries?: unknown };
      const nextFood = sanitizeEntries(Array.isArray(parsed.foodEntries) ? parsed.foodEntries : []);
      const nextWorkouts = sanitizeEntries(
        Array.isArray(parsed.workoutEntries) ? parsed.workoutEntries : [],
      );
      setFoodEntries(nextFood);
      setWorkoutEntries(nextWorkouts);
      saveEntries(nextFood, nextWorkouts);
      setStatus("Backup restored successfully.");
    } catch {
      setStatus("Could not restore backup. Make sure the file is valid JSON.", true);
    }
    e.target.value = "";
  }

  useEffect(() => {
    if (!backupMenuOpen) return;
    function onPointerDown(ev: MouseEvent | TouchEvent) {
      const el = backupMenuRef.current;
      const btn = backupMenuButtonRef.current;
      if (!el || !btn) return;
      const target = ev.target as Node;
      if (el.contains(target) || btn.contains(target)) return;
      setBackupMenuOpen(false);
    }
    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === "Escape") setBackupMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [backupMenuOpen]);

  const foodByDate = groupedByDate(foodEntries);
  const workoutsByDate = groupedByDate(workoutEntries);
  const allDates = Array.from(
    new Set([...Object.keys(foodByDate), ...Object.keys(workoutsByDate)]),
  ).sort((a, b) => b.localeCompare(a));

  return (
    <>
      <nav
        className="sticky top-0 z-50 border-b border-slate-200/90 bg-white shadow-sm"
        aria-label="Primary"
      >
        <div className="mx-auto flex max-w-4xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex shrink-0 justify-start">
            <a
              href="https://github.com/evanhanawalt/calorie-tracker"
              target="_blank"
              rel="noopener noreferrer"
              title="github"
              className="rounded-md p-2 text-slate-800 outline-none ring-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-950 focus-visible:ring-2"
              aria-label="View this project on GitHub"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 98 96"
                className="size-7"
                aria-hidden="true"
                focusable="false"
              >
                <path
                  fill="currentColor"
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M48.854 0C21.839 0 0 22 0 49.217c0 21.756 13.993 40.172 33.405 46.69 2.427.49 3.316-1.059 3.316-2.362 0-1.141-.08-5.052-.08-9.127-13.59 2.934-16.42-5.867-16.42-5.867-2.184-5.704-5.42-7.17-5.42-7.17-4.448-3.015.324-3.015.324-3.015 4.934.326 7.523 5.052 7.523 5.052 4.367 7.496 11.404 5.378 14.294 4.074.404-3.178 1.699-5.378 3.074-6.6-10.839-1.141-22.243-5.378-22.243-24.283 0-5.378 1.94-9.778 5.014-13.2-.485-1.222-2.184-6.275.486-13.038 0 0 4.125-1.304 13.426 5.052a46.97 46.97 0 0 1 12.214-1.63c4.125 0 8.33.571 12.213 1.63 9.302-6.356 13.427-5.052 13.427-5.052 2.67 6.763.97 11.816.485 13.038 3.155 3.422 5.015 7.822 5.015 13.2 0 18.905-11.404 23.06-22.324 24.283 1.78 1.548 3.316 4.481 3.316 9.126 0 6.6-.08 11.897-.08 13.526 0 1.304.89 2.853 3.316 2.364 19.412-6.52 33.405-24.935 33.405-46.691C97.707 22 75.788 0 48.854 0z"
                />
              </svg>
            </a>
          </div>

          <div className="relative flex shrink-0 justify-end">
            <button
              ref={backupMenuButtonRef}
              type="button"
              className={`rounded-md p-2 text-slate-700 outline-none ring-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 ${backupMenuOpen ? "bg-slate-100" : ""}`}
              aria-expanded={backupMenuOpen}
              aria-haspopup="true"
              aria-controls="backup-restore-menu"
              onClick={() => setBackupMenuOpen((o) => !o)}
              title="Backup and restore"
            >
              <span className="sr-only">Open backup and restore menu</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="size-6 shrink-0"
                aria-hidden="true"
              >
                <path d="M15.2 3a2 2 0 0 1 1.4.6l3.8 3.8a2 2 0 0 1 .6 1.4V19a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
                <path d="M17 21v-7a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v7" />
                <path d="M7 3v4a1 1 0 0 0 1 1h7" />
              </svg>
            </button>

            {backupMenuOpen ? (
              <div
                ref={backupMenuRef}
                id="backup-restore-menu"
                role="region"
                aria-labelledby={backupMenuHeadingId}
                className="absolute right-0 top-full z-50 mt-2 min-w-[16rem] rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
              >
                <h2 id={backupMenuHeadingId} className="mb-3 text-lg font-semibold">
                  Backup / Restore
                </h2>
                <div className="flex flex-col gap-3">
                  <button
                    id="download-backup"
                    type="button"
                    className="w-full rounded-md bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
                    onClick={() => {
                      onDownloadBackup();
                    }}
                  >
                    Download JSON Backup
                  </button>
                  <label className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-slate-300 px-3 py-2 text-sm hover:bg-slate-50">
                    <span>Upload JSON Backup</span>
                    <input
                      id="upload-backup"
                      type="file"
                      accept="application/json"
                      className="hidden"
                      onChange={onUploadBackupChange}
                    />
                  </label>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl space-y-6 p-4 md:p-8">
        <header className="mb-1">
          <h1 className="text-3xl font-bold">Calorie Tracker</h1>
          <p className="mt-2 text-sm font-bold text-slate-600">
            Track calories consumed and burned by day. Data is stored in your browser.
          </p>
        </header>

        <p
          id="status"
          role="status"
          aria-live="polite"
          className={`min-h-10 text-sm m-0 leading-5 italic ${
            statusIsError ? "text-red-600" : "text-slate-600"
          }`}
        >
          {statusMessage}
        </p>

        <section className="grid gap-4 rounded-xl bg-white p-4 shadow-sm md:grid-cols-2">
          <div>
            <h2 className="mb-3 text-lg font-semibold">Add Meal</h2>
            <form id="food-form" className="space-y-3" onSubmit={onFoodSubmit}>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Date</span>
                <input
                  id="food-date"
                  name="date"
                  type="date"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={foodDate}
                  onChange={(ev) => setFoodDate(ev.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Calories</span>
                <input
                  id="food-calories"
                  name="calories"
                  type="number"
                  min={0}
                  step={1}
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={foodCalories}
                  onChange={(ev) => setFoodCalories(ev.target.value)}
                />
              </label>
              <button
                type="submit"
                className="rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-700"
              >
                Add Meal
              </button>
            </form>
          </div>

          <div>
            <h2 className="mb-3 text-lg font-semibold">Add Workout</h2>
            <form id="workout-form" className="space-y-3" onSubmit={onWorkoutSubmit}>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Date</span>
                <input
                  id="workout-date"
                  name="date"
                  type="date"
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={workoutDate}
                  onChange={(ev) => setWorkoutDate(ev.target.value)}
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block font-medium">Calories Burned</span>
                <input
                  id="workout-calories"
                  name="calories"
                  type="number"
                  min={0}
                  step={1}
                  required
                  className="w-full rounded-md border border-slate-300 px-3 py-2"
                  value={workoutCalories}
                  onChange={(ev) => setWorkoutCalories(ev.target.value)}
                />
              </label>
              <button
                type="submit"
                className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
              >
                Add Workout
              </button>
            </form>
          </div>
        </section>

        <section className="rounded-xl bg-white p-4 shadow-sm">
          <h2 className="mb-3 text-lg font-semibold">Daily Summary</h2>
          <div id="daily-summary" className="space-y-4">
            {allDates.length === 0 ? (
              <p className="text-sm text-slate-600">No entries yet. Add a meal or workout to get started.</p>
            ) : (
              allDates.map((date) => {
                const meals = (foodByDate[date] ?? []).slice().sort((a, b) => a.count - b.count);
                const workouts = (workoutsByDate[date] ?? []).slice().sort((a, b) => a.count - b.count);
                const consumed = sumCalories(meals);
                const burned = sumCalories(workouts);
                const net = consumed - burned;
                return (
                  <article key={date} className="rounded-lg border border-slate-200 p-4">
                    <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                      <h3 className="text-base font-semibold">{formatDateForDisplay(date)}</h3>
                      <p className="text-sm text-slate-700">
                        Consumed: {consumed} | Burned: {burned} | Net: {net}
                      </p>
                    </div>
                    <div className="grid gap-3 text-sm md:grid-cols-2">
                      <div>
                        <h4 className="font-medium">Meals</h4>
                        <ul className="mt-1 list-inside list-disc text-slate-700">
                          {meals.length ? (
                            meals.map((entry) => (
                              <li key={`${date}-food-${entry.count}`}>{entryItemLabel("food", entry)}</li>
                            ))
                          ) : (
                            <li>No meals logged</li>
                          )}
                        </ul>
                      </div>
                      <div>
                        <h4 className="font-medium">Workouts</h4>
                        <ul className="mt-1 list-inside list-disc text-slate-700">
                          {workouts.length ? (
                            workouts.map((entry) => (
                              <li key={`${date}-wo-${entry.count}`}>
                                {entryItemLabel("workout", entry)}
                              </li>
                            ))
                          ) : (
                            <li>No workouts logged</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </article>
                );
              })
            )}
          </div>
        </section>
      </main>
    </>
  );
}
