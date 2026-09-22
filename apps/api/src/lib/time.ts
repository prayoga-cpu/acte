/**
 * Timestamps are stored and returned in UTC; the UI displays Europe/Paris
 * (docs/04-engineering/CONVENTIONS.md). Anything that buckets by "day" or
 * "month" (Home KPIs, the weekly chart) must bucket by the Paris calendar
 * date, not the UTC one, or a task logged at 23:30 Paris time would land
 * on the wrong day around midnight UTC.
 */
const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Paris",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const weekdayFormatter = new Intl.DateTimeFormat("en-US", { timeZone: "Europe/Paris", weekday: "short" });
const WEEKDAY_INDEX: Record<string, number> = { Mon: 0, Tue: 1, Wed: 2, Thu: 3, Fri: 4, Sat: 5, Sun: 6 };

export function parisDateKey(date: Date): string {
  return dateKeyFormatter.format(date);
}

export function parisMonthKey(date: Date): string {
  return parisDateKey(date).slice(0, 7);
}

/** Midnight (UTC instant) of the Monday of `date`'s Paris week. */
export function startOfParisWeek(date: Date): Date {
  const [y, m, d] = parisDateKey(date).split("-").map(Number) as [number, number, number];
  const offset = WEEKDAY_INDEX[weekdayFormatter.format(date)] ?? 0;
  const monday = new Date(Date.UTC(y, m - 1, d));
  monday.setUTCDate(monday.getUTCDate() - offset);
  return monday;
}
