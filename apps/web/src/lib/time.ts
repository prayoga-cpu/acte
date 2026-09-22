/**
 * "Today" in this app always means the Europe/Paris calendar day
 * (docs/04-engineering/CONVENTIONS.md), never the viewer's local timezone —
 * a lawyer opening ACTE from outside France must still see the same
 * "today" the API computes. Mirrors apps/api/src/lib/time.ts and
 * apps/api/src/db/seed.ts's `todayAtParisTime`.
 */
export function todayKeyParis(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Paris", year: "numeric", month: "2-digit", day: "2-digit" }).format(
    new Date(),
  );
}

/** "09:00" -> that Paris-local time today, as a UTC ISO instant. */
export function parisTimeToIso(hhmm: string): string {
  const [h, m] = hhmm.split(":").map(Number) as [number, number];
  const todayKey = todayKeyParis();
  const naiveUtc = new Date(`${todayKey}T${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:00Z`);
  const parisHourLabel = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Paris", hour: "2-digit", hour12: false }).format(naiveUtc);
  const offsetHours = h - Number(parisHourLabel);
  naiveUtc.setUTCHours(naiveUtc.getUTCHours() + offsetHours);
  return naiveUtc.toISOString();
}
