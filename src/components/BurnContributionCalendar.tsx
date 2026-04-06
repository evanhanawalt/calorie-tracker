import {
  buildContributionCells,
  monthKeyForIso,
  parseIsoLocal,
  type ContributionCell,
} from "../lib/calendarGrid";
import { formatDateForDisplay } from "../lib/calorieTrackerStorage";

type Props = {
  todayIso: string;
  weeks?: number;
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  /** True when there was any logged activity on that calendar day (e.g. meal or workout). */
  dayHasActivity: (iso: string) => boolean;
};

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
  selectedDate: string;
  onSelectDate: (iso: string) => void;
  dayHasActivity: (iso: string) => boolean;
};

function ContributionBand({
  bandIndex,
  bandCount,
  startWeek,
  weekCount,
  allCells,
  selectedDate,
  onSelectDate,
  dayHasActivity,
}: BandProps) {
  const bandCells = allCells.slice(startWeek * 7, (startWeek + weekCount) * 7);
  const monthHeaderSegments = monthHeaderSegmentsForWeekRange(
    allCells,
    startWeek,
    weekCount,
  );
  const colTemplate = `repeat(${weekCount}, minmax(0, 1fr))`;

  return (
    <div
      className="flex min-w-0 flex-col gap-1 [--activity-on:var(--color-blue-400)] [--activity-off:var(--color-slate-200)]"
      role="presentation"
    >
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
            className="flex min-h-4 min-w-0 items-start justify-start overflow-hidden whitespace-nowrap text-[12px] leading-none text-slate-500"
            style={{ gridColumn: `${seg.startCol} / span ${seg.span}` }}
            title={seg.label}
          >
            {seg.label}
          </div>
        ))}
      </div>

      <div className="flex min-w-0 gap-1">
        <div
          className="grid w-7 shrink-0 grid-rows-7 gap-1 text-[8px] leading-none text-slate-500"
          aria-hidden="true"
        >
          {(["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"] as const).map((d) => (
            <span
              key={d}
              className="flex min-h-[10px] min-w-0 flex-1 items-center justify-end pr-0.5"
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
            gridTemplateRows: "repeat(7, minmax(10px, 1fr))",
            gridAutoFlow: "column",
          }}
        >
          {bandCells.map((cell: ContributionCell) => {
            const hasActivity = !cell.isFuture && dayHasActivity(cell.iso);
            const selected = cell.iso === selectedDate;
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
                className={`h-full min-h-[14px] min-w-0 w-full max-w-full rounded-xs border border-slate-300/90 transition-[box-shadow,transform] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-1 ${cell.isFuture ? "cursor-default border-slate-200 opacity-40" : "cursor-pointer hover:ring-1 hover:ring-slate-400"} ${selected ? "ring-2 ring-blue-600 ring-offset-1" : ""}`}
                style={{
                  backgroundColor: cell.isFuture
                    ? "var(--activity-off)"
                    : hasActivity
                      ? "var(--activity-on)"
                      : "var(--activity-off)",
                }}
              />
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default function BurnContributionCalendar({
  todayIso,
  weeks = 53,
  selectedDate,
  onSelectDate,
  dayHasActivity,
}: Props) {
  const cells = buildContributionCells(todayIso, weeks);
  const numWeeks = weeks;
  const weeksFirstBand = Math.ceil(numWeeks / 2);
  const weeksSecondBand = numWeeks - weeksFirstBand;

  const totalBands =
    (weeksFirstBand > 0 ? 1 : 0) + (weeksSecondBand > 0 ? 1 : 0);

  return (
    <div className="space-y-3">
      <div className="flex w-full min-w-0 flex-col gap-3">
        {weeksSecondBand > 0 ? (
          <ContributionBand
            bandIndex={1}
            bandCount={totalBands}
            startWeek={weeksFirstBand}
            weekCount={weeksSecondBand}
            allCells={cells}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            dayHasActivity={dayHasActivity}
          />
        ) : null}

        {weeksFirstBand > 0 ? (
          <ContributionBand
            bandIndex={0}
            bandCount={totalBands}
            startWeek={0}
            weekCount={weeksFirstBand}
            allCells={cells}
            selectedDate={selectedDate}
            onSelectDate={onSelectDate}
            dayHasActivity={dayHasActivity}
          />
        ) : null}
      </div>
    </div>
  );
}
