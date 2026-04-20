import {
  buildContributionCells,
  contributionFiveCellRowWidthCss,
  contributionWeekColumnWidthCss,
  monthKeyForIso,
  parseIsoLocal,
  type ContributionCell,
} from "../lib/calendarGrid";
import {
  CONTRIBUTION_LEGEND_BANDS,
  formatDateForDisplay,
} from "../lib/calorieTrackerStorage";

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
                    : "cursor-pointer hover:scale-115"
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

function ContributionCalendarLegend({
  weekColumnCount,
}: {
  weekColumnCount: number;
}) {
  const cellW = contributionWeekColumnWidthCss(weekColumnCount);
  const bmrStripW = contributionFiveCellRowWidthCss(weekColumnCount);

  return (
    <div
      className="ml-6 mt-3 flex flex-col gap-1 border-t border-ink/20 pt-3"
      role="region"
      aria-label="Calendar color legend: net calories versus BMR, and disabled days"
    >
      <div className="flex w-full items-center gap-1">
        {CONTRIBUTION_LEGEND_BANDS.map((band) => (
          <div
            key={band.color}
            title={band.label}
            className="box-border min-h-[14px] shrink-0 rounded-full"
            style={{
              width: cellW,
              minHeight: "14px",
              backgroundColor: band.color,
              border: "1.5px solid var(--color-ink)",
            }}
          />
        ))}
      </div>
      <div
        className="flex justify-between gap-2 font-display text-[11px] italic text-muted"
        style={{ width: bmrStripW }}
      >
        <span>under BMR</span>
        <span>over BMR</span>
      </div>
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
  const cells = buildContributionCells(todayIso, CONDENSED_WEEKS);

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
      <ContributionCalendarLegend weekColumnCount={CONDENSED_WEEKS} />
    </div>
  );
}
