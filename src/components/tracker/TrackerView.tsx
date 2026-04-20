"use client";

import { useCallback, useId, useMemo, useRef, useState } from "react";
import { contributionCalendarDateBounds } from "@/lib/calendarGrid";
import {
  contributionColorForNetVsBmr,
  contributionTextColorForNetVsBmr,
  DEFAULT_BMR,
  formatDateForDisplay,
  getDailyTrackerDerivations,
  getLocalTodayIso,
  netVsBmrState,
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
import CircleIcon from "@/components/tracker/CircleIcon";
import Confetti from "@/components/tracker/Confetti";
import Sticker from "@/components/tracker/Sticker";
import StatusStamp from "@/components/StatusStamp";
import TrackerDialog from "@/components/TrackerDialog";
import { SvgPlus, SvgSquarePen, SvgTrash } from "@/svgs";
import TrackerAppMenu from "./TrackerAppMenu";
import { STREAM_UI } from "./trackerUiConfig";

type TrackerViewProps = {
  storageMode: TrackerStorageMode;
};

/**
 * Main tracker page (Tracker style). Keeps the same hook wiring — auth,
 * migration prompts, local/remote queries, entry mutations — but renders
 * everything on flat sticker cards with chunky chips and the dot-style
 * heatmap.
 */
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
    addTarget,
    addCaloriesInput,
    setAddCaloriesInput,
    openAddDialog,
    closeAddDialog,
    confirmAdd,
    editTarget,
    editCaloriesInput,
    setEditCaloriesInput,
    deleteTarget,
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

  const bmr = settingsQuery.data?.bmrKcal ?? DEFAULT_BMR;

  const getActivityDayColor = useCallback(
    (iso: string) => {
      const netConsumed = dayMap.get(iso)?.netConsumed ?? 0;
      return contributionColorForNetVsBmr(netConsumed, bmr);
    },
    [dayMap, bmr],
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

  const listByStream: Record<EntryStream, { entries: Entry[]; total: number }> =
    {
      food: { entries: meals, total: consumed },
      workout: { entries: workouts, total: burned },
    };

  const headerConsumed = summaryQuery.data?.consumed ?? consumed;
  const headerBurned = summaryQuery.data?.burned ?? burned;
  const headerNet = summaryQuery.data?.netConsumed ?? netConsumed;
  const delta = headerNet - bmr;

  const addTitle = addTarget
    ? `Add ${STREAM_UI[addTarget.stream].singular}`
    : "";

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
      ? `Delete ${STREAM_UI[deleteTarget.stream].singular} ${deleteDisplayIndex + 1} (${deleteTarget.entry.calories} kcal) on ${formatDateForDisplay(deleteTarget.entry.date)}?`
      : "";

  const deleteTitle = deleteTarget
    ? `Delete this ${STREAM_UI[deleteTarget.stream].singular}?`
    : "";

  const sessionUser = authSession.data?.user;
  const displayName =
    sessionUser?.name?.trim() || sessionUser?.email || "Account";
  const displayEmail =
    sessionUser?.name?.trim() && sessionUser?.email
      ? sessionUser.email
      : undefined;

  const loadingDay = summaryQuery.isPending && !summaryQuery.data;
  const statusText = loadingDay
    ? "Loading today…"
    : derivedSummaryError ||
      statusMessage ||
      (calendarQuery.isPending ? "Loading calendar…" : "");

  return (
    <div className="relative">
      <Confetti />

      <TrackerDialog
        open={migrationOpen}
        onClose={onMigrationDialogClose}
        title="Save local data to your account?"
        description="Looks like you've been tracking your calories locally. Now that you have an account, you can transfer this data. We'll delete the copy stored in your browser after a successful upload."
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
        description="Your account already has meals or workouts. Uploading will replace all of that data with the entries in your browser."
        primaryLabel="Replace and upload"
        primaryVariant="danger"
        primaryDisabled={migrationBusy}
        onPrimary={() => void migrateLocalToCloud(true)}
        secondaryLabel="Cancel"
        onSecondary={() => setMigrationReplaceOpen(false)}
      />

      <TrackerDialog
        open={!!addTarget}
        onClose={closeAddDialog}
        title={addTitle}
        primaryLabel="Add"
        onPrimary={confirmAdd}
        primaryDisabled={!addTarget}
      >
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-label text-muted">
            {addTarget
              ? STREAM_UI[addTarget.stream].fieldLabel
              : "Calories"}
          </span>
          <input
            type="number"
            min={0}
            step={1}
            autoFocus
            placeholder="0"
            className="tracker-input text-3xl"
            value={addCaloriesInput}
            onChange={(ev) => setAddCaloriesInput(ev.target.value)}
            onKeyDown={(ev) => {
              if (ev.key === "Enter") {
                ev.preventDefault();
                confirmAdd();
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
        <label className="block">
          <span className="mb-2 block text-xs uppercase tracking-label text-muted">
            Calories
          </span>
          <input
            type="number"
            min={0}
            step={1}
            autoFocus
            className="tracker-input text-3xl"
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

      <main
        id="main"
        className="relative z-10 mx-auto max-w-5xl px-4 pb-4 pt-3 md:px-8 md:pb-8 md:pt-4"
      >
        <StatusStamp
          id="status"
          message={statusText}
          isError={statusIsError || !!derivedSummaryError}
        />

        <div className="mt-1 space-y-6">
          <HeroSticker
            dateLabel={formatDateForDisplay(selectedSummaryDate)}
            isToday={selectedSummaryDate === todayIso}
            consumed={headerConsumed}
            burned={headerBurned}
            net={headerNet}
            bmr={bmr}
            delta={delta}
            loading={loadingDay}
          />

          <Sticker
            delay={160}
            className="bg-cream px-4 py-6 md:px-7"
          >
            <div className="flex items-baseline justify-between">
              <h2 className="font-display text-display-lg leading-none">
                History
              </h2>
              <span className="text-sm text-muted">Select a day</span>
            </div>
            <div className="mt-4">
              <BurnContributionCalendar
                todayIso={todayIso}
                selectedDate={selectedSummaryDate}
                onSelectDate={setSelectedSummaryDate}
                dayHasActivity={dayHasActivity}
                getActivityDayColor={getActivityDayColor}
              />
            </div>
            {!hasAnyCalendarActivity ? (
              <p className="mt-4 text-center text-muted">
                No entries yet. Add a meal or workout below to get started.
              </p>
            ) : null}
          </Sticker>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            <LogPanel
              stream="food"
              delay={240}
              entries={listByStream.food.entries}
              total={listByStream.food.total}
              onAdd={() => openAddDialog("food")}
              onEdit={(entry) => openEditDialog("food", entry)}
              onDelete={(entry) => openDeleteDialog("food", entry)}
            />
            <LogPanel
              stream="workout"
              delay={320}
              entries={listByStream.workout.entries}
              total={listByStream.workout.total}
              onAdd={() => openAddDialog("workout")}
              onEdit={(entry) => openEditDialog("workout", entry)}
              onDelete={(entry) => openDeleteDialog("workout", entry)}
            />
          </div>
        </div>
      </main>
    </div>
  );
}

/* ---------- Pieces ---------- */

function HeroSticker({
  dateLabel,
  isToday,
  consumed,
  burned,
  net,
  bmr,
  delta,
  loading,
}: {
  dateLabel: string;
  isToday: boolean;
  consumed: number;
  burned: number;
  net: number;
  bmr: number;
  delta: number;
  loading: boolean;
}) {
  const over = delta > 0;
  const state = netVsBmrState(net, bmr);
  const badgeBg = contributionColorForNetVsBmr(net, bmr);
  const badgeText = contributionTextColorForNetVsBmr(net, bmr);
  const stateLabel =
    state === "over" ? (
      "Over"
    ) : state === "under" ? (
      "Under"
    ) : (
      <>
        On
        <br />
        Target
      </>
    );
  return (
    <Sticker
      delay={80}
      className="relative bg-cream px-6 py-8 md:px-10 md:py-10"
    >
      <CircleIcon
        as="span"
        size="lg"
        className="absolute -right-3 -top-3 font-display text-center leading-tight shadow-sticker-sm"
        style={{ backgroundColor: badgeBg, color: badgeText }}
        aria-hidden
      >
        {stateLabel}
      </CircleIcon>
      <p className="text-xs uppercase tracking-eyebrow text-hot">
        {isToday ? `Today · ${dateLabel}` : dateLabel}
      </p>
      <div className="mt-2 flex flex-wrap items-end gap-6">
        <div>
          <p className="text-xs uppercase tracking-label text-muted">
            Net kcal
          </p>
          <p
            className={"font-display text-display-hero-lg leading-[0.85] tabular-nums text-ink"}
          >
            {loading ? "—" : net.toLocaleString()}
          </p>
        </div>
        <div className="flex flex-col gap-2">
          <Chip className="bg-ocean" label={`Consumed ${consumed}`} />
          <Chip className="bg-hot text-cream" label={`Burned ${burned}`} />
          <Chip
            className={"bg-sun"}
            label={`${over ? "+" : ""}${delta} vs BMR ${bmr}`}
          />
        </div>
      </div>
    </Sticker>
  );
}

function Chip({ className = "", label }: { className?: string; label: string }) {
  return <span className={`tracker-chip ${className}`.trim()}>{label}</span>;
}

type LogAccent = {
  /** Tailwind classes for accent backgrounds (chip, add button, index badge). */
  bg: string;
  /** Tailwind color class for the panel title. */
  text: string;
};

const FOOD_ACCENT: LogAccent = {
  bg: "bg-ocean text-ink",
  text: "text-ocean",
};
const WORKOUT_ACCENT: LogAccent = {
  bg: "bg-hot text-cream",
  text: "text-hot",
};

type LogPanelProps = {
  stream: EntryStream;
  delay: number;
  entries: Entry[];
  total: number;
  onAdd: () => void;
  onEdit: (entry: Entry) => void;
  onDelete: (entry: Entry) => void;
};

function LogPanel({
  stream,
  delay,
  entries,
  total,
  onAdd,
  onEdit,
  onDelete,
}: LogPanelProps) {
  const ui = STREAM_UI[stream];
  const isFood = stream === "food";
  const accent = isFood ? FOOD_ACCENT : WORKOUT_ACCENT;
  const title = isFood ? "Meals" : "Workouts";
  const subtitle = isFood ? "Calories consumed today" : "Calories burned today";

  return (
    <Sticker delay={delay} className="relative bg-cream px-5 py-6 md:px-7">
      <span
        className={`tracker-chip absolute -left-3 -top-3 ${accent.bg}`}
        aria-hidden
      >
        Total {total}
      </span>

      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className={`font-display text-display-xl leading-none ${accent.text}`}>
            {title}
          </h3>
          <p className="text-sm text-muted">{subtitle}</p>
        </div>
        <CircleIcon
          size="md"
          onClick={onAdd}
          title={`Add ${ui.singular}`}
          aria-label={`Add ${ui.singular}`}
          className={`tracker-sticker-btn shrink-0 shadow-sticker-sm transition-transform hover:scale-105 ${accent.bg}`}
        >
          <SvgPlus className="size-6" aria-hidden="true" />
        </CircleIcon>
      </div>

      <ul className="mt-5 space-y-2">
        {entries.length === 0 ? (
          <li>
            <button
              type="button"
              onClick={onAdd}
              aria-label={ui.listEmptyText}
              className="block w-full cursor-pointer rounded-2xl border-2 border-dashed border-ink/25 px-4 py-3 text-center font-display italic text-muted transition-colors hover:border-ink hover:text-ink"
            >
              {ui.listEmptyText}
            </button>
          </li>
        ) : (
          entries.map((entry, idx) => (
            <li
              key={entry.id}
              className="group tracker-sticker-sm flex items-center gap-3 bg-paper px-3 py-2"
            >
              <CircleIcon as="span" size="xs" className={accent.bg}>
                {idx + 1}
              </CircleIcon>
              <span className="font-display text-display-sm tabular-nums">
                {entry.calories.toLocaleString()}
                <span className="ml-1 font-body text-sm not-italic text-muted">
                  kcal
                </span>
              </span>
              <span className="ml-auto flex gap-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                <CircleIcon
                  size="sm"
                  title="Edit"
                  aria-label={`Edit ${ui.singular} ${idx + 1}`}
                  onClick={() => onEdit(entry)}
                  className="bg-sun"
                >
                  <SvgSquarePen className="size-4" aria-hidden="true" />
                </CircleIcon>
                <CircleIcon
                  size="sm"
                  title="Delete"
                  aria-label={`Delete ${ui.singular} ${idx + 1}`}
                  onClick={() => onDelete(entry)}
                  className="bg-hot text-cream"
                >
                  <SvgTrash className="size-4" aria-hidden="true" />
                </CircleIcon>
              </span>
            </li>
          ))
        )}
      </ul>
    </Sticker>
  );
}
