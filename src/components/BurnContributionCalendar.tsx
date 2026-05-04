import { useState } from "react";
import {
  buildContributionCells,
  monthKeyForIso,
  parseIsoLocal,
  startOfWeekSunday,
  toIsoLocal,
  type ContributionCell,
} from "../lib/calendarGrid";
import {
  CONTRIBUTION_LEGEND_BANDS,
  formatDateForDisplay,
} from "../lib/trackerDomain";
import { SvgChevronLeft, SvgChevronRight } from "../svgs";

type Props = {
  todayIso: string;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  /** True when there was any logged activity on that calendar day (e.g. meal or workout). */
  dayHasActivity: (iso: string) => boolean;
  /** Background for days with activity (net vs BMR palette). Only called when `dayHasActivity(iso)`. */
  getActivityDayColor: (iso: string) => string;
};

/** Rolling window of weeks rendered in the condensed heatmap. */
const CONDENSED_WEEKS = 6;

function monthLabelForIso(iso: string): string {
  const d = parseIsoLocal(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (d.getMonth() === 0) {
    return d.toLocaleDateString("en-US", { month: "short", year: "numeric" });
  }
  return d.toLocaleDateString("en-US", { month: "short" });
}

function cellAriaLabel(
  iso: string,
  hasActivity: boolean,
  isFuture: boolean,
): string {
  const datePart = formatDateForDisplay(iso);
  if (isFuture) return `${datePart}, future date`;
  if (!hasActivity) return `${datePart}, no activity logged`;
  return `${datePart}, activity logged`;
}

type MonthHeaderSegment = {
  /** 1-based column index within the band grid */
  startCol: number;
  span: number;
  label: string;
};

function monthHeaderSegmentsForWeekRange(
  allCells: ContributionCell[],
  startWeek: number,
  weekCount: number,
): MonthHeaderSegment[] {
  const segments: MonthHeaderSegment[] = [];
  let openStart: number | null = null;
  let openLabel = "";

  const flush = (endWeek: number) => {
    if (openStart !== null) {
      segments.push({
        startCol: openStart + 1,
        span: endWeek - openStart,
        label: openLabel,
      });
      openStart = null;
    }
  };

  for (let w = 0; w < weekCount; w++) {
    const gw = startWeek + w;
    const sundayIso = allCells[gw * 7]?.iso;
    if (!sundayIso) {
      flush(w);
      continue;
    }
    const prevSunday = gw > 0 ? allCells[(gw - 1) * 7]?.iso : null;
    const isBoundary =
      !prevSunday || monthKeyForIso(sundayIso) !== monthKeyForIso(prevSunday);

    if (isBoundary) {
      flush(w);
      openStart = w;
      openLabel = monthLabelForIso(sundayIso);
    }
  }
  flush(weekCount);
  return segments;
}

type BandProps = {
  bandIndex: number;
  bandCount: number;
  startWeek: number;
  weekCount: number;
  allCells: ContributionCell[];
  todayIso: string;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  dayHasActivity: (iso: string) => boolean;
  getActivityDayColor: (iso: string) => string;
};

function ContributionBand({
  bandIndex,
  bandCount,
  startWeek,
  weekCount,
  allCells,
  todayIso,
  selectedDate,
  onSelectDate,
  dayHasActivity,
  getActivityDayColor,
}: BandProps) {
  const bandCells = allCells.slice(startWeek * 7, (startWeek + weekCount) * 7);
  const monthHeaderSegments = monthHeaderSegmentsForWeekRange(
    allCells,
    startWeek,
    weekCount,
  );
  const colTemplate = `repeat(${weekCount}, minmax(0, 1fr))`;

  return (
    <div className="flex min-w-0 flex-col gap-1" role="presentation">
      <div
        className="grid gap-1"
        style={{
          paddingLeft: "1.75rem",
          gridTemplateColumns: colTemplate,
        }}
        aria-hidden="true"
      >
        {monthHeaderSegments.map((seg) => (
          <div
            key={`mh-${startWeek}-${seg.startCol}-${seg.label}`}
            className="flex min-h-4 min-w-0 select-none items-start justify-start overflow-hidden whitespace-nowrap font-display text-[12px] italic leading-none text-muted"
            style={{ gridColumn: `${seg.startCol} / span ${seg.span}` }}
            title={seg.label}
          >
            {seg.label}
          </div>
        ))}
      </div>

      <div className="flex min-w-0 gap-1">
        <div
          className="grid w-7 shrink-0 select-none grid-rows-7 gap-1 text-[9px] leading-none text-muted"
          aria-hidden="true"
        >
          {(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const).map((d) => (
            <span
              key={d}
              className="flex min-h-[20px] min-w-0 flex-1 items-center justify-end pr-0.5"
            >
              {d}
            </span>
          ))}
        </div>

        <div
          role="grid"
          aria-label={
            bandCount > 1
              ? `Activity by day, band ${bandIndex + 1} of ${bandCount}`
              : "Activity by day"
          }
          className="grid min-w-0 flex-1 gap-1"
          style={{
            gridTemplateColumns: colTemplate,
            gridTemplateRows: "repeat(7, minmax(20px, 1fr))",
            gridAutoFlow: "column",
          }}
        >
          {bandCells.map((cell: ContributionCell) => {
            const hasActivity = !cell.isFuture && dayHasActivity(cell.iso);
            const selected = cell.iso === selectedDate;
            const isToday = cell.iso === todayIso;
            const background = cell.isFuture
              ? "rgba(27,15,10,0.08)"
              : hasActivity
                ? getActivityDayColor(cell.iso)
                : "rgba(27,15,10,0.18)";
            return (
              <button
                key={cell.iso}
                type="button"
                role="gridcell"
                aria-disabled={cell.isFuture}
                tabIndex={cell.isFuture ? -1 : undefined}
                title={formatDateForDisplay(cell.iso)}
                aria-label={cellAriaLabel(cell.iso, hasActivity, cell.isFuture)}
                aria-selected={selected}
                aria-current={selected ? "date" : undefined}
                onClick={() => {
                  if (cell.isFuture) return;
                  onSelectDate(cell.iso);
                }}
                className={`h-full min-h-[20px] min-w-0 w-full max-w-full rounded-full transition-transform ${
                  cell.isFuture
                    ? "cursor-default opacity-50"
                    : "cursor-pointer hover:scale-115 hover:z-10"
                }`}
                style={{
                  backgroundColor: background,
                  boxShadow: selected
                    ? "0 0 0 2px var(--color-ink), 0 0 0 4px var(--color-sun)"
                    : isToday && !selected
                      ? "0 0 0 1.5px var(--color-ink)"
                      : undefined,
                  opacity: cell.isFuture ? 0.5 : hasActivity ? 0.95 : 0.9,
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

const LEGEND_GRADIENT = `linear-gradient(to right, ${CONTRIBUTION_LEGEND_BANDS.map(
  (b) => b.color,
).join(", ")})`;

function ContributionCalendarLegend() {
  return (
    <div
      className="flex items-center justify-center gap-2"
      role="region"
      aria-label="Calendar color legend: net calories versus BMR"
    >
      <span className="font-display text-[10px] italic text-muted">
        under BMR
      </span>
      <div
        className="h-2.5 w-24 rounded-full"
        style={{
          background: LEGEND_GRADIENT,
          border: "1.5px solid var(--color-ink)",
        }}
        title="Net calories versus BMR: green is under, red is over"
        aria-hidden="true"
      />
      <span className="font-display text-[10px] italic text-muted">
        over BMR
      </span>
    </div>
  );
}

function shiftIsoByDays(iso: string, days: number): string {
  const d = parseIsoLocal(iso);
  if (Number.isNaN(d.getTime())) return iso;
  d.setDate(d.getDate() + days);
  return toIsoLocal(d);
}

function formatRangeLabel(startIso: string, endIso: string): string {
  const s = parseIsoLocal(startIso);
  const e = parseIsoLocal(endIso);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "";
  const sameYear = s.getFullYear() === e.getFullYear();
  const startLabel = s.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    ...(sameYear ? {} : { year: "numeric" }),
  });
  const endLabel = e.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
  return `${startLabel} – ${endLabel}`;
}

type NavProps = {
  onPrev: () => void;
  onNext: () => void;
  canGoNext: boolean;
  rangeLabel: string;
};

function ContributionCalendarNav({
  onPrev,
  onNext,
  canGoNext,
  rangeLabel,
}: NavProps) {
  return (
    <div className="flex items-center justify-center gap-2 text-muted">
      <button
        type="button"
        onClick={onPrev}
        aria-label="Show earlier weeks"
        title="Earlier weeks"
        className="flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-ink/40 text-ink transition-colors hover:border-ink hover:bg-ink hover:text-cream"
      >
        <SvgChevronLeft className="size-3.5" aria-hidden="true" />
      </button>
      <span
        className="min-w-36 text-center font-display text-[11px] italic tabular-nums"
        aria-live="polite"
      >
        {rangeLabel}
      </span>
      <button
        type="button"
        onClick={onNext}
        disabled={!canGoNext}
        aria-label="Show later weeks"
        title={canGoNext ? "Later weeks" : "Already at the latest week"}
        className="flex h-6 w-6 items-center justify-center rounded-full border-[1.5px] border-ink/40 text-ink transition-colors enabled:hover:border-ink enabled:hover:bg-ink enabled:hover:text-cream disabled:cursor-not-allowed disabled:opacity-40"
      >
        <SvgChevronRight className="size-3.5" aria-hidden="true" />
      </button>
    </div>
  );
}

/**
 * Activity heatmap rendered as dots in the Tracker palette. Scope is a
 * condensed rolling window (last {@link CONDENSED_WEEKS} weeks) so cells stay
 * chunky and easy to tap on mobile.
 */
export default function BurnContributionCalendar({
  todayIso,
  selectedDate,
  onSelectDate,
  dayHasActivity,
  getActivityDayColor,
}: Props) {
  const [weekOffset, setWeekOffset] = useState(0);

  const anchorIso =
    weekOffset === 0 ? todayIso : shiftIsoByDays(todayIso, weekOffset * 7);
  const cells = buildContributionCells(todayIso, CONDENSED_WEEKS, anchorIso);

  const firstIso = cells[0]?.iso ?? todayIso;
  const lastCellIso = cells[cells.length - 1]?.iso ?? todayIso;
  const lastVisibleIso = lastCellIso > todayIso ? todayIso : lastCellIso;
  const rangeLabel = formatRangeLabel(firstIso, lastVisibleIso);

  const canGoNext = (() => {
    const todaySunday = toIsoLocal(startOfWeekSunday(parseIsoLocal(todayIso)));
    const anchorSunday = toIsoLocal(
      startOfWeekSunday(parseIsoLocal(anchorIso)),
    );
    return anchorSunday < todaySunday;
  })();

  return (
    <div className="space-y-3">
      <div className="flex w-full min-w-0 flex-col gap-3">
        <ContributionBand
          bandIndex={0}
          bandCount={1}
          startWeek={0}
          weekCount={CONDENSED_WEEKS}
          allCells={cells}
          todayIso={todayIso}
          selectedDate={selectedDate}
          onSelectDate={onSelectDate}
          dayHasActivity={dayHasActivity}
          getActivityDayColor={getActivityDayColor}
        />
      </div>
      <ContributionCalendarNav
        onPrev={() => setWeekOffset((o) => o - 1)}
        onNext={() => setWeekOffset((o) => Math.min(0, o + 1))}
        canGoNext={canGoNext}
        rangeLabel={rangeLabel}
      />
      <ContributionCalendarLegend />
    </div>
  );
}
