/** Local calendar date from yyyy-mm-dd (no UTC shift). */
export function parseIsoLocal(iso: string): Date {
  const parts = iso.split("-").map(Number);
  if (parts.length !== 3 || parts.some((n) => Number.isNaN(n))) {
    return new Date(NaN);
  }
  const [y, m, d] = parts;
  return new Date(y, m - 1, d);
}

export function toIsoLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Inclusive range of calendar yyyy-mm-dd strings (local dates). */
export function listIsoDatesInclusive(
  startIso: string,
  endIso: string,
): string[] {
  const start = parseIsoLocal(startIso);
  const end = parseIsoLocal(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return [];
  }
  const out: string[] = [];
  const cur = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const endT = new Date(end.getFullYear(), end.getMonth(), end.getDate());
  while (cur.getTime() <= endT.getTime()) {
    out.push(toIsoLocal(cur));
    cur.setDate(cur.getDate() + 1);
  }
  return out;
}

/** Week starts Sunday (0) through Saturday (6), matching GitHub-style graphs. */
export function startOfWeekSunday(d: Date): Date {
  const c = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = c.getDay();
  c.setDate(c.getDate() - day);
  return c;
}

export type ContributionCell = {
  iso: string;
  weekIndex: number;
  /** 0 = Sunday … 6 = Saturday */
  weekdayIndex: number;
  isFuture: boolean;
};

/**
 * Flat list in column-major order (each week: Sun→Sat) for CSS
 * `grid-template-rows: repeat(7, …); grid-auto-flow: column`.
 */
export function buildContributionCells(
  todayIso: string,
  numWeeks = 53,
): ContributionCell[] {
  const today = parseIsoLocal(todayIso);
  if (Number.isNaN(today.getTime())) {
    return [];
  }
  const endSunday = startOfWeekSunday(today);
  const firstSunday = new Date(endSunday);
  firstSunday.setDate(firstSunday.getDate() - (numWeeks - 1) * 7);

  const cells: ContributionCell[] = [];
  for (let w = 0; w < numWeeks; w++) {
    for (let r = 0; r < 7; r++) {
      const d = new Date(firstSunday);
      d.setDate(firstSunday.getDate() + w * 7 + r);
      const iso = toIsoLocal(d);
      cells.push({
        iso,
        weekIndex: w,
        weekdayIndex: r,
        isFuture: iso > todayIso,
      });
    }
  }
  return cells;
}

/** First and last yyyy-mm-dd in the contribution grid (inclusive). */
export function contributionCalendarDateBounds(
  todayIso: string,
  numWeeks = 53,
): { start: string; end: string } {
  const cells = buildContributionCells(todayIso, numWeeks);
  if (!cells.length) {
    return { start: todayIso, end: todayIso };
  }
  const sorted = cells.map((c) => c.iso).sort((a, b) => a.localeCompare(b));
  return { start: sorted[0], end: sorted[sorted.length - 1] };
}

/** First day of month (yyyy-mm-01) for a cell; used for month headers. */
export function monthKeyForIso(iso: string): string {
  return iso.slice(0, 7);
}

/** Tailwind `gap-1` on the contribution calendar grid (keep in sync). */
const CONTRIBUTION_GRID_GAP = "0.25rem";

/**
 * Width of one week column inside the contribution grid: equal columns with `gap-1`.
 * Use as `width` on legend swatches so they match calendar cell width.
 */
export function contributionWeekColumnWidthCss(weekCount: number): string {
  if (weekCount < 1) return "100%";
  return `calc((100% - ${weekCount - 1} * ${CONTRIBUTION_GRID_GAP}) / ${weekCount})`;
}

/** Width of five week columns plus four `gap-1` gutters (BMR legend strip). */
export function contributionFiveCellRowWidthCss(weekCount: number): string {
  if (weekCount < 1) return "100%";
  const g = CONTRIBUTION_GRID_GAP;
  return `calc(5 * ((100% - ${weekCount - 1} * ${g}) / ${weekCount}) + 4 * ${g})`;
}
