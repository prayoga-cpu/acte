/**
 * Europe/Paris calendar helpers shared by apps/web and apps/api
 * (docs/04-engineering/CONVENTIONS.md: timestamps are UTC in the API,
 * Europe/Paris in the UI). "Today" always means the Paris day, never the
 * viewer's or the server's local one.
 */
const PARIS = "Europe/Paris";

const dateKeyFormatter = new Intl.DateTimeFormat("en-CA", { timeZone: PARIS, year: "numeric", month: "2-digit", day: "2-digit" });
const partsFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: PARIS,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

/** "2026-09-30" for the Paris calendar day `date` falls on. */
export function parisDateKey(date: Date): string {
  return dateKeyFormatter.format(date);
}

/** "2026-09" for the Paris calendar month `date` falls in. */
export function parisMonthKey(date: Date): string {
  return parisDateKey(date).slice(0, 7);
}

/** What a Paris wall clock shows at `instant`, read as if it were UTC (ms). */
function parisWallClockAsUtc(instant: number): number {
  const parts = Object.fromEntries(partsFormatter.formatToParts(new Date(instant)).map((p) => [p.type, p.value]));
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day), Number(parts.hour), Number(parts.minute));
}

/**
 * A Paris-local date and time ("2026-09-30", "23:30") as a UTC ISO instant.
 * The offset is measured on the whole wall-clock value, not on the hour
 * digits alone — comparing hours only wraps at midnight and pushed
 * late-evening entries onto the next day.
 */
export function parisDateTimeToIso(dateKey: string, hhmm: string): string {
  const d = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateKey);
  const t = /^(\d{1,2}):(\d{2})$/.exec(hhmm);
  if (!d || !t) throw new Error("Expected a YYYY-MM-DD date and an HH:MM time");
  const [hours, minutes] = [Number(t[1]), Number(t[2])];
  if (hours > 23 || minutes > 59) throw new Error("Expected an HH:MM time");

  const wanted = Date.UTC(Number(d[1]), Number(d[2]) - 1, Number(d[3]), hours, minutes);
  // Two passes: the first guess uses the offset in force at `wanted` read as
  // UTC, the second corrects it when that guess sits across a clock change.
  let instant = wanted - (parisWallClockAsUtc(wanted) - wanted);
  instant = wanted - (parisWallClockAsUtc(instant) - instant);
  return new Date(instant).toISOString();
}

/** "2026-09-29" for `dateKey` minus/plus whole days. */
export function shiftDateKey(dateKey: string, days: number): string {
  const [y, m, d] = dateKey.split("-").map(Number) as [number, number, number];
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}
