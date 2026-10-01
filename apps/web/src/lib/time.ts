import { parisDateKey, parisDateTimeToIso } from "@acte/contracts";

/**
 * "Today" in this app always means the Europe/Paris calendar day
 * (docs/04-engineering/CONVENTIONS.md), never the viewer's local timezone —
 * a lawyer opening ACTE from outside France must still see the same
 * "today" the API computes. The conversion itself lives in
 * packages/contracts/src/time.ts, shared with the API and the seed.
 */
export function todayKeyParis(): string {
  return parisDateKey(new Date());
}

/** "09:00" on a Paris day ("2026-09-30", today by default) -> a UTC ISO instant. */
export function parisTimeToIso(hhmm: string, dateKey: string = todayKeyParis()): string {
  return parisDateTimeToIso(dateKey, hhmm);
}

/** The Paris wall-clock time of an instant, as "HH:MM" for a time input. */
export function isoToParisTime(iso: string): string {
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(new Date(iso));
  return `${parts.find((p) => p.type === "hour")?.value ?? "00"}:${parts.find((p) => p.type === "minute")?.value ?? "00"}`;
}

/** Noon UTC of a date key — a stable instant to format that calendar day from, whatever the viewer's timezone. */
export function dateKeyToDate(dateKey: string): Date {
  return new Date(`${dateKey}T12:00:00Z`);
}
