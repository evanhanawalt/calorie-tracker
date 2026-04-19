import {
  useCallback,
  useEffect,
  useId,
  useMemo,
  useReducer,
  useRef,
  useState,
} from "react";
import {
  contributionColorForNetVsBmr,
  entryItemLabel,
  formatDateForDisplay,
  getDailyTrackerDerivations,
  getInitialTrackerState,
  getLocalTodayIso,
  loadBmr,
  netCaloriesForDate,
  saveBmr,
  trackerReducer,
  type Entry,
  type EntryStream,
} from "../../lib/calorieTrackerStorage";
import {
  isLogDateAllowed,
  parseNonNegativeCalories,
} from "../../lib/calorieTrackerValidators";
import { startGoogleSignIn } from "../../lib/googleSignInClient";
import BurnContributionCalendar from "../BurnContributionCalendar";
import SignInWithGoogleButton from "../SignInWithGoogleButton";
import TrackerDialog from "../TrackerDialog";
import { SvgGitHubMark, SvgHamburger, SvgSquarePen, SvgTrash } from "../../svgs";
import { STREAM_ORDER, STREAM_UI } from "./trackerUiConfig";

export default function LocalTrackerView() {
  const [state, dispatch] = useReducer(
    trackerReducer,
    undefined,
    getInitialTrackerState,
  );
  const { foodEntries, workoutEntries } = state;

  const [calorieInputs, setCalorieInputs] = useState<
    Record<EntryStream, string>
  >({ food: "", workout: "" });
  const [statusMessage, setStatusMessage] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [bmr, setBmr] = useState(() => loadBmr());
  const [bmrDialogOpen, setBmrDialogOpen] = useState(false);
  const [bmrInput, setBmrInput] = useState(() => String(loadBmr()));
  const [selectedSummaryDate, setSelectedSummaryDate] = useState(() =>
    getLocalTodayIso(),
  );
  const todayIso = getLocalTodayIso();

  const [editTarget, setEditTarget] = useState<null | {
    stream: EntryStream;
    entry: Entry;
  }>(null);
  const [editCaloriesInput, setEditCaloriesInput] = useState("");

  const [deleteTarget, setDeleteTarget] = useState<null | {
    stream: EntryStream;
    entry: Entry;
  }>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuHeadingId = useId();

  function setStatus(message: string, isError = false) {
    setStatusMessage(message);
    setStatusIsError(isError);
  }

  function onLogSubmit(
    stream: EntryStream,
    e: React.FormEvent<HTMLFormElement>,
  ) {
    e.preventDefault();
    const ui = STREAM_UI[stream];
    const date = selectedSummaryDate;
    const calories = parseNonNegativeCalories(Number(calorieInputs[stream]));
    if (!isLogDateAllowed(date, todayIso)) {
      setStatus("Pick a day on the calendar (not a future date).", true);
      return;
    }
    if (calories === null) {
      setStatus(ui.invalidLogCalories, true);
      return;
    }
    dispatch({ type: "addEntry", stream, date, calories });
    setCalorieInputs((prev) => ({ ...prev, [stream]: "" }));
    setStatus(ui.addedMessage);
  }

  function openEditDialog(stream: EntryStream, entry: Entry) {
    setEditTarget({ stream, entry });
    setEditCaloriesInput(String(entry.calories));
  }

  function closeEditDialog() {
    setEditTarget(null);
  }

  function confirmEdit() {
    if (!editTarget) return;
    const calories = parseNonNegativeCalories(Number(editCaloriesInput));
    const singular = STREAM_UI[editTarget.stream].singular;
    if (calories === null) {
      setStatus(`Please enter a valid ${singular} calories value.`, true);
      return;
    }
    dispatch({
      type: "updateEntryCalories",
      stream: editTarget.stream,
      id: editTarget.entry.id,
      calories,
    });
    setStatus(STREAM_UI[editTarget.stream].editSuccess);
    closeEditDialog();
  }

  function openDeleteDialog(stream: EntryStream, entry: Entry) {
    setDeleteTarget({ stream, entry });
  }

  function closeDeleteDialog() {
    setDeleteTarget(null);
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    dispatch({
      type: "deleteEntry",
      stream: deleteTarget.stream,
      id: deleteTarget.entry.id,
    });
    setStatus(STREAM_UI[deleteTarget.stream].deleteSuccess);
    closeDeleteDialog();
  }

  useEffect(() => {
    if (!menuOpen) return;
    function onPointerDown(ev: MouseEvent | TouchEvent) {
      const el = menuRef.current;
      const btn = menuButtonRef.current;
      if (!el || !btn) return;
      const target = ev.target as Node;
      if (el.contains(target) || btn.contains(target)) return;
      setMenuOpen(false);
    }
    function onKeyDown(ev: KeyboardEvent) {
      if (ev.key === "Escape") setMenuOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown, { passive: true });
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [menuOpen]);

  const {
    allDates,
    foodByDate,
    workoutsByDate,
    meals,
    workouts,
    consumed,
    burned,
    net,
  } = useMemo(
    () =>
      getDailyTrackerDerivations(
        foodEntries,
        workoutEntries,
        selectedSummaryDate,
      ),
    [foodEntries, workoutEntries, selectedSummaryDate],
  );

  const dayHasActivity = useCallback(
    (iso: string) =>
      (foodByDate[iso]?.length ?? 0) > 0 ||
      (workoutsByDate[iso]?.length ?? 0) > 0,
    [foodByDate, workoutsByDate],
  );

  const getActivityDayColor = useCallback(
    (iso: string) =>
      contributionColorForNetVsBmr(
        netCaloriesForDate(foodByDate, workoutsByDate, iso),
        bmr,
      ),
    [foodByDate, workoutsByDate, bmr],
  );

  function openBmrDialog() {
    setBmrInput(String(bmr));
    setBmrDialogOpen(true);
    setMenuOpen(false);
  }

  function closeBmrDialog() {
    setBmrDialogOpen(false);
  }

  function confirmBmr() {
    const n = Number(bmrInput);
    if (!Number.isFinite(n) || n < 500 || n > 20000) {
      setStatus("Enter a daily BMR between 500 and 20,000 kcal.", true);
      return;
    }
    const rounded = Math.round(n);
    setBmr(rounded);
    saveBmr(rounded);
    setStatus("BMR saved.");
    closeBmrDialog();
  }

  const summaryDate = selectedSummaryDate;

  const listByStream: Record<EntryStream, { entries: Entry[]; total: number }> =
    {
      food: { entries: meals, total: consumed },
      workout: { entries: workouts, total: burned },
    };

  const editTitle = editTarget
    ? `Edit ${STREAM_UI[editTarget.stream].singular} calories`
    : "";

  const deleteDisplayIndex = deleteTarget
    ? deleteTarget.stream === "food"
      ? meals.findIndex((e) => e.id === deleteTarget.entry.id)
      : workouts.findIndex((e) => e.id === deleteTarget.entry.id)
    : -1;

  const deleteDescription =
    deleteTarget && deleteDisplayIndex >= 0
      ? `Delete ${STREAM_UI[deleteTarget.stream].singular} ${deleteDisplayIndex + 1} (${deleteTarget.entry.calories} cal) on ${formatDateForDisplay(deleteTarget.entry.date)}?`
      : "";

  const deleteTitle = deleteTarget
    ? `Delete ${STREAM_UI[deleteTarget.stream].singular}?`
    : "";

  return (
    <>
      <TrackerDialog
        open={bmrDialogOpen}
        onClose={closeBmrDialog}
        title="Daily BMR (kcal)"
        description="Basal metabolic rate used for calendar colors (net intake vs this value). Stored in this browser only."
        primaryLabel="Save"
        onPrimary={confirmBmr}
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">BMR</span>
          <input
            type="number"
            min={500}
            max={20000}
            step={1}
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={bmrInput}
            onChange={(ev) => setBmrInput(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                confirmBmr();
              }
            }}
          />
        </label>
      </TrackerDialog>

      <TrackerDialog
        open={!!editTarget}
        onClose={closeEditDialog}
        title={editTitle}
        primaryLabel="Save"
        onPrimary={confirmEdit}
        primaryDisabled={!editTarget}
      >
        <label className="block text-sm">
          <span className="mb-1 block font-medium text-slate-800">
            Calories
          </span>
          <input
            type="number"
            min={0}
            step={1}
            autoFocus
            className="w-full rounded-md border border-slate-300 px-3 py-2"
            value={editCaloriesInput}
            onChange={(ev) => setEditCaloriesInput(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                confirmEdit();
              }
            }}
          />
        </label>
      </TrackerDialog>

      <TrackerDialog
        open={!!deleteTarget}
        onClose={closeDeleteDialog}
        title={deleteTitle}
        description={deleteDescription}
        primaryLabel="Delete"
        primaryVariant="danger"
        onPrimary={confirmDelete}
        primaryDisabled={!deleteTarget}
      />

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
          <div>
            <h1 className="text-2xl font-bold">Calorie Tracker</h1>
          </div>
          <div className="relative flex shrink-0 justify-end">
            <button
              ref={menuButtonRef}
              type="button"
              className={`rounded-md p-2 text-slate-700 outline-none ring-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-900 focus-visible:ring-2 ${menuOpen ? "bg-slate-100" : ""}`}
              aria-expanded={menuOpen}
              aria-haspopup="true"
              aria-controls="app-menu"
              onClick={() => setMenuOpen((o) => !o)}
              title="Menu"
            >
              <span className="sr-only">
                Open menu (account, BMR settings)
              </span>
              <SvgHamburger className="size-6 shrink-0" aria-hidden="true" />
            </button>

            {menuOpen ? (
              <div
                ref={menuRef}
                id="app-menu"
                role="region"
                aria-labelledby={menuHeadingId}
                className="absolute right-0 top-full z-50 mt-2 min-w-[16rem] rounded-lg border border-slate-200 bg-white p-4 shadow-lg"
              >
                <h2
                  id={menuHeadingId}
                  className="mb-3 text-lg font-semibold"
                >
                  Menu
                </h2>
                <div className="flex flex-col gap-3">
                  <button
                    type="button"
                    className="w-full rounded-md border border-slate-300 px-4 py-2 text-sm font-medium text-slate-800 hover:bg-slate-50"
                    onClick={openBmrDialog}
                  >
                    Set daily BMR ({bmr} kcal)
                  </button>
                  <div className="mt-3 border-t border-slate-200 pt-3">
                    <SignInWithGoogleButton
                      type="button"
                      onClick={() => {
                        setMenuOpen(false);
                        void (async () => {
                          try {
                            await startGoogleSignIn();
                          } catch {
                            setStatus(
                              "Could not start sign-in. Check your connection and try again.",
                              true,
                            );
                          }
                        })();
                      }}
                    />
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-4xl space-y-4 p-4 md:p-8">
        <p
          id="status"
          role="status"
          aria-live="polite"
          className={`text-sm m-0 leading-5 italic ${
            statusIsError ? "text-red-600" : "text-slate-600"
          }`}
        >
          {statusMessage}&nbsp;
        </p>

        <section className="grid gap-4 rounded-xl bg-white p-4 shadow-sm md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="flex justify-between items-center">
              <h2 className="mb-3 text-lg font-semibold">
                {formatDateForDisplay(summaryDate)}
              </h2>
              <p className="text-sm text-slate-700">
                Consumed: {consumed} | Burned: {burned} | Net: {net}
              </p>
            </div>
            <BurnContributionCalendar
              todayIso={todayIso}
              selectedDate={selectedSummaryDate}
              onSelectDate={setSelectedSummaryDate}
              dayHasActivity={dayHasActivity}
              getActivityDayColor={getActivityDayColor}
            />
          </div>
          {STREAM_ORDER.map((stream) => {
            const ui = STREAM_UI[stream];
            return (
              <div key={stream}>
                <h2 className="mb-3 text-lg font-semibold">
                  {ui.logSectionTitle}
                </h2>
                <form
                  id={ui.formId}
                  className="space-y-3"
                  onSubmit={(e) => onLogSubmit(stream, e)}
                >
                  <label className="block text-sm">
                    <span className="mb-1 block font-medium">
                      {ui.fieldLabel}
                    </span>
                    <input
                      id={ui.inputId}
                      name="calories"
                      type="number"
                      min={0}
                      step={1}
                      required
                      className="w-full rounded-md border border-slate-300 px-3 py-2"
                      value={calorieInputs[stream]}
                      onChange={(ev) =>
                        setCalorieInputs((prev) => ({
                          ...prev,
                          [stream]: ev.target.value,
                        }))
                      }
                    />
                  </label>
                  <button type="submit" className={ui.submitButtonClass}>
                    {ui.submitLabel}
                  </button>
                </form>
              </div>
            );
          })}
          <div className="md:col-span-2">
            <div id="daily-summary" className="space-y-4">
              {allDates.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No entries yet. Add a meal or workout to get started.
                </p>
              ) : null}
              <article className="rounded-lg border border-slate-200 p-4">
                <div className="grid gap-3 text-sm md:grid-cols-2">
                  {STREAM_ORDER.map((stream) => {
                    const ui = STREAM_UI[stream];
                    const { entries, total } = listByStream[stream];
                    return (
                      <div key={stream}>
                        <div className="flex justify-between items-center">
                          <h4 className="font-medium">{ui.listHeading}</h4>
                          <p className="text-sm text-slate-700">
                            Total: {total}
                          </p>
                        </div>
                        <ul className="mt-1 list-inside list-disc text-slate-700">
                          {entries.length ? (
                            entries.map((entry, idx) => (
                              <li
                                key={entry.id}
                                className="flex items-center gap-2"
                              >
                                <span className="min-w-0 flex-1 leading-5">
                                  {entryItemLabel(stream, idx + 1, entry)}
                                </span>
                                <span className="inline-flex shrink-0 items-center gap-1">
                                  <button
                                    type="button"
                                    title="Edit"
                                    aria-label={`Edit ${ui.singular} ${idx + 1}`}
                                    className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
                                    onClick={() =>
                                      openEditDialog(stream, entry)
                                    }
                                  >
                                    <SvgSquarePen
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </button>
                                  <button
                                    type="button"
                                    title="Delete"
                                    aria-label={`Delete ${ui.singular} ${idx + 1}`}
                                    className="inline-flex h-5 w-5 items-center justify-center rounded text-slate-600 hover:bg-red-50 hover:text-red-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-200"
                                    onClick={() =>
                                      openDeleteDialog(stream, entry)
                                    }
                                  >
                                    <SvgTrash
                                      className="size-4"
                                      aria-hidden="true"
                                    />
                                  </button>
                                </span>
                              </li>
                            ))
                          ) : (
                            <li>{ui.listEmptyText}</li>
                          )}
                        </ul>
                      </div>
                    );
                  })}
                </div>
              </article>
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
