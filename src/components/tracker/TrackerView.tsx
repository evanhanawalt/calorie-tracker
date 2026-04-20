"use client";

import {
  useCallback,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";
import { contributionCalendarDateBounds } from "@/lib/calendarGrid";
import {
  contributionColorForNetVsBmr,
  DEFAULT_BMR,
  entryItemLabel,
  formatDateForDisplay,
  getDailyTrackerDerivations,
  getLocalTodayIso,
  type Entry,
  type EntryStream,
} from "@/lib/calorieTrackerStorage";
import { useAuthSessionQuery } from "@/hooks/trackerRemote";
import { useInvalidateAuthOnFocus } from "@/hooks/useInvalidateAuthOnFocus";
import { useMigrationPrompt } from "@/hooks/useMigrationPrompt";
import { useTrackerEntryActions } from "@/hooks/useTrackerEntryActions";
import { useTrackerMenuDismiss } from "@/hooks/useTrackerMenuDismiss";
import { useTrackerQueries } from "@/hooks/useTrackerQueries";
import type { TrackerStorageMode } from "@/lib/trackerQueryKeys";
import BurnContributionCalendar from "@/components/BurnContributionCalendar";
import TrackerDialog from "@/components/TrackerDialog";
import { SvgSquarePen, SvgTrash } from "@/svgs";
import TrackerAppMenu from "./TrackerAppMenu";
import { STREAM_ORDER, STREAM_UI } from "./trackerUiConfig";

type TrackerViewProps = {
  storageMode: TrackerStorageMode;
};

export default function TrackerView({ storageMode }: TrackerViewProps) {
  const authSession = useAuthSessionQuery();

  const todayIso = getLocalTodayIso();
  const { start: calendarStart, end: calendarEnd } = useMemo(
    () => contributionCalendarDateBounds(todayIso),
    [todayIso],
  );

  const [selectedSummaryDate, setSelectedSummaryDate] = useState(() =>
    getLocalTodayIso(),
  );
  const [statusMessage, setStatusMessage] = useState("");
  const [statusIsError, setStatusIsError] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuHeadingId = useId();

  function setStatus(message: string, isError = false) {
    setStatusMessage(message);
    setStatusIsError(isError);
  }

  const {
    summaryQuery,
    settingsQuery,
    calendarQuery,
    trackerMut,
    derivedSummaryError,
  } = useTrackerQueries(
    storageMode,
    selectedSummaryDate,
    calendarStart,
    calendarEnd,
  );

  const {
    migrationOpen,
    migrationReplaceOpen,
    migrationBusy,
    setMigrationReplaceOpen,
    migrateLocalToCloud,
    declineMigration,
    onMigrationDialogClose,
  } = useMigrationPrompt(storageMode, setStatus);

  const {
    calorieInputs,
    setCalorieInputs,
    editTarget,
    editCaloriesInput,
    setEditCaloriesInput,
    deleteTarget,
    onLogSubmit,
    openEditDialog,
    closeEditDialog,
    confirmEdit,
    openDeleteDialog,
    closeDeleteDialog,
    confirmDelete,
  } = useTrackerEntryActions({
    selectedSummaryDate,
    todayIso,
    trackerMut,
    setStatus,
  });

  useInvalidateAuthOnFocus();

  useTrackerMenuDismiss({
    menuOpen,
    setMenuOpen,
    menuRef,
    menuButtonRef,
  });

  const dayMap = useMemo(() => {
    const m = new Map<string, { netConsumed: number; hasActivity: boolean }>();
    for (const d of calendarQuery.data ?? []) {
      m.set(d.date, {
        netConsumed: d.netConsumed,
        hasActivity: d.hasActivity,
      });
    }
    return m;
  }, [calendarQuery.data]);

  const dayHasActivity = useCallback(
    (iso: string) => dayMap.get(iso)?.hasActivity ?? false,
    [dayMap],
  );

  const getActivityDayColor = useCallback(
    (iso: string) => {
      const netConsumed = dayMap.get(iso)?.netConsumed ?? 0;
      const b = settingsQuery.data?.bmrKcal ?? DEFAULT_BMR;
      return contributionColorForNetVsBmr(netConsumed, b);
    },
    [dayMap, settingsQuery.data],
  );

  const { meals, workouts, consumed, burned, netConsumed } = useMemo(() => {
    const food = summaryQuery.data?.meals ?? [];
    const wo = summaryQuery.data?.workouts ?? [];
    return getDailyTrackerDerivations(food, wo, selectedSummaryDate);
  }, [summaryQuery.data, selectedSummaryDate]);

  const hasAnyCalendarActivity = useMemo(
    () => (calendarQuery.data ?? []).some((d) => d.hasActivity),
    [calendarQuery.data],
  );

  const summaryDate = selectedSummaryDate;

  const listByStream: Record<EntryStream, { entries: Entry[]; total: number }> =
    {
      food: { entries: meals, total: consumed },
      workout: { entries: workouts, total: burned },
    };

  const headerConsumed = summaryQuery.data?.consumed ?? consumed;
  const headerBurned = summaryQuery.data?.burned ?? burned;
  const headerNet = summaryQuery.data?.netConsumed ?? netConsumed;

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

  const sessionUser = authSession.data?.user;
  const displayName =
    sessionUser?.name?.trim() || sessionUser?.email || "Account";
  const displayEmail =
    sessionUser?.name?.trim() && sessionUser?.email
      ? sessionUser.email
      : undefined;

  return (
    <>
      <TrackerDialog
        open={migrationOpen}
        onClose={onMigrationDialogClose}
        title="Save local data to your account?"
        description="Looks like you've been tracking your calories locally. Now that you have an account, you can transfer this data to your account. This will delete the copy stored in your browser after a successful upload."
        primaryLabel="Transfer data"
        primaryDisabled={migrationBusy}
        onPrimary={() => void migrateLocalToCloud(false)}
        secondaryLabel="Keep data local"
        onSecondary={() => declineMigration()}
      />

      <TrackerDialog
        open={migrationReplaceOpen}
        onClose={() => setMigrationReplaceOpen(false)}
        title="Replace account data?"
        description="Your account already has meals or workouts. Uploading will replace all of that data with your local browser data."
        primaryLabel="Replace and upload"
        primaryVariant="danger"
        primaryDisabled={migrationBusy}
        onPrimary={() => void migrateLocalToCloud(true)}
        secondaryLabel="Cancel"
        onSecondary={() => setMigrationReplaceOpen(false)}
      />

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

      <TrackerAppMenu
        storageMode={storageMode}
        menuOpen={menuOpen}
        setMenuOpen={setMenuOpen}
        menuRef={menuRef}
        menuButtonRef={menuButtonRef}
        menuHeadingId={menuHeadingId}
        userName={displayName}
        userEmail={displayEmail}
        authPending={authSession.isPending}
        onSignInError={(msg) => setStatus(msg, true)}
        onSignOutError={(msg) => setStatus(msg, true)}
      />

      <main className="mx-auto max-w-4xl space-y-4 p-4 md:p-8">
        <p
          id="status"
          role="status"
          aria-live="polite"
          className={`text-sm m-0 leading-5 italic ${
            statusIsError || derivedSummaryError
              ? "text-red-600"
              : "text-slate-600"
          }`}
        >
          {summaryQuery.isPending && !summaryQuery.data
            ? "Loading day…"
            : derivedSummaryError ||
              statusMessage ||
              (calendarQuery.isPending ? "Loading calendar…" : "")}
          &nbsp;
        </p>

        <section className="grid gap-4 rounded-xl bg-white p-4 shadow-sm md:grid-cols-2">
          <div className="md:col-span-2">
            <div className="flex justify-between items-center">
              <h2 className="mb-3 text-lg font-semibold">
                {formatDateForDisplay(summaryDate)}
              </h2>
              <p className="text-sm text-slate-700">
                Consumed: {headerConsumed} | Burned: {headerBurned} | Net:{" "}
                {headerNet}
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
              {!hasAnyCalendarActivity ? (
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
