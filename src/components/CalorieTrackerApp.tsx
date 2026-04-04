import { useCallback, useEffect, useId, useRef, useState } from "react";
import {
  deleteEntryAndRenumber,
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
import BurnContributionCalendar from "./BurnContributionCalendar";
import { SvgGitHubMark, SvgSaveDisk, SvgSquarePen, SvgTrash } from "../svgs";

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
  const [selectedSummaryDate, setSelectedSummaryDate] = useState(() => getLocalTodayIso());

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

  const DEFAULT_BACKUP_FILENAME = "calorie-tracker-backup.json";

  async function onDownloadBackup() {
    const payload = {
      foodEntries,
      workoutEntries,
    };
    const json = JSON.stringify(payload, null, 2);
    const blob = new Blob([json], { type: "application/json" });

    if (typeof window.showSaveFilePicker === "function") {
      try {
        const handle = await window.showSaveFilePicker({
          startIn: "downloads",
          suggestedName: DEFAULT_BACKUP_FILENAME,
          types: [
            {
              description: "JSON",
              accept: { "application/json": [".json"] },
            },
          ],
        });
        const writable = await handle.createWritable();
        await writable.write(blob);
        await writable.close();
        setStatus("Backup saved.");
        return;
      } catch (err) {
        if (err instanceof DOMException && err.name === "AbortError") {
          return;
        }
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = DEFAULT_BACKUP_FILENAME;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setStatus("Backup saved.");
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

  function onEditEntry(type: "food" | "workout", entry: Entry) {
    const label = type === "food" ? "meal" : "workout";
    const next = window.prompt(`Edit ${label} calories:`, String(entry.calories));
    if (next === null) return;

    const calories = Number(next);
    if (!Number.isFinite(calories) || calories < 0) {
      setStatus(`Please enter a valid ${label} calories value.`, true);
      return;
    }

    const roundCal = Math.round(calories);

    if (type === "food") {
      const nextFood = foodEntries.map((e) =>
        e.date === entry.date && e.count === entry.count ? { ...e, calories: roundCal } : e,
      );
      setFoodEntries(nextFood);
      saveEntries(nextFood, workoutEntries);
      setStatus("Meal updated.");
      return;
    }

    const nextWorkouts = workoutEntries.map((e) =>
      e.date === entry.date && e.count === entry.count ? { ...e, calories: roundCal } : e,
    );
    setWorkoutEntries(nextWorkouts);
    saveEntries(foodEntries, nextWorkouts);
    setStatus("Workout updated.");
  }

  function onDeleteEntry(type: "food" | "workout", entry: Entry) {
    const label = type === "food" ? "meal" : "workout";
    if (
      !window.confirm(
        `Delete ${label} ${entry.count} (${entry.calories} cal) on ${formatDateForDisplay(entry.date)}?`,
      )
    ) {
      return;
    }
    if (type === "food") {
      const nextFood = deleteEntryAndRenumber(foodEntries, entry.date, entry.count);
      setFoodEntries(nextFood);
      saveEntries(nextFood, workoutEntries);
      setStatus("Meal deleted.");
      return;
    }
    const nextWorkouts = deleteEntryAndRenumber(workoutEntries, entry.date, entry.count);
    setWorkoutEntries(nextWorkouts);
    saveEntries(foodEntries, nextWorkouts);
    setStatus("Workout deleted.");
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

  const todayIso = getLocalTodayIso();
  const getBurnedForDay = useCallback(
    (iso: string) => sumCalories(workoutsByDate[iso] ?? []),
    [workoutsByDate],
  );

  const summaryDate = selectedSummaryDate;
  const meals = (foodByDate[summaryDate] ?? []).slice().sort((a, b) => a.count - b.count);
  const workouts = (workoutsByDate[summaryDate] ?? []).slice().sort((a, b) => a.count - b.count);
  const consumed = sumCalories(meals);
  const burned = sumCalories(workouts);
  const net = consumed - burned;

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
              <SvgGitHubMark className="size-7" />
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
              <SvgSaveDisk className="size-6 shrink-0" aria-hidden="true" />
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
                      void onDownloadBackup();
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
            ) : null}

          

            <article className="rounded-lg border border-slate-200 p-4">
              <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                <h3 className="text-base font-semibold">{formatDateForDisplay(summaryDate)}</h3>
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
                        <li key={`${summaryDate}-food-${entry.count}`} className="flex items-center gap-2">
                          <span className="min-w-0 flex-1 leading-5">
                            {entryItemLabel("food", entry)}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              title="Edit"
                              aria-label={`Edit meal ${entry.count}`}
                              className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                              onClick={() => onEditEntry("food", entry)}
                            >
                              <SvgSquarePen className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              aria-label={`Delete meal ${entry.count}`}
                              className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                              onClick={() => onDeleteEntry("food", entry)}
                            >
                              <SvgTrash className="size-4" aria-hidden="true" />
                            </button>
                          </span>
                        </li>
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
                        <li
                          key={`${summaryDate}-wo-${entry.count}`}
                          className="flex items-center gap-2"
                        >
                          <span className="min-w-0 flex-1 leading-5">
                            {entryItemLabel("workout", entry)}
                          </span>
                          <span className="inline-flex shrink-0 items-center gap-1">
                            <button
                              type="button"
                              title="Edit"
                              aria-label={`Edit workout ${entry.count}`}
                              className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                              onClick={() => onEditEntry("workout", entry)}
                            >
                              <SvgSquarePen className="size-4" aria-hidden="true" />
                            </button>
                            <button
                              type="button"
                              title="Delete"
                              aria-label={`Delete workout ${entry.count}`}
                              className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                              onClick={() => onDeleteEntry("workout", entry)}
                            >
                              <SvgTrash className="size-4" aria-hidden="true" />
                            </button>
                          </span>
                        </li>
                      ))
                    ) : (
                      <li>No workouts logged</li>
                    )}
                  </ul>
                </div>
              </div>
            </article>
            <BurnContributionCalendar
              todayIso={todayIso}
              selectedDate={selectedSummaryDate}
              onSelectDate={setSelectedSummaryDate}
              getBurnedForDay={getBurnedForDay}
            />
          </div>
        </section>
      </main>
    </>
  );
}
