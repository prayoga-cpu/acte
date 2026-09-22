export { fmtEurFromCents, fmtMin } from "@acte/contracts";

const timeFormatter = new Intl.DateTimeFormat("fr-FR", {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Europe/Paris",
});

function parisHHmm(iso: string): string {
  const parts = timeFormatter.formatToParts(new Date(iso));
  const h = parts.find((p) => p.type === "hour")?.value ?? "00";
  const m = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${h}h${m}`;
}

/** "09h15 – 10h32", exactly as the prototype formats a task's time range. */
export function fmtTimeRange(startedAt: string, endedAt: string): string {
  return `${parisHHmm(startedAt)} – ${parisHHmm(endedAt)}`;
}

export function fmtEurFromEur(eur: number): string {
  return Math.round(eur).toLocaleString("fr-FR") + " €";
}
