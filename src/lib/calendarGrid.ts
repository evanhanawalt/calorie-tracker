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
export function buildContributionCells(todayIso: string, numWeeks = 53): ContributionCell[] {
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

/** First day of month (yyyy-mm-01) for a cell; used for month headers. */
export function monthKeyForIso(iso: string): string {
  return iso.slice(0, 7);
}
