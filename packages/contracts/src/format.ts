/**
 * Shared with apps/web and apps/api so every surface formats durations and
 * money exactly like the prototype (docs/04-engineering/CONVENTIONS.md).
 */
export function fmtMin(min: number): string {
  const h = Math.floor(min / 60);
  const mm = Math.round(min % 60);
  return h > 0 ? `${h} h ${String(mm).padStart(2, "0")}` : `${mm} min`;
}

export function fmtEurFromCents(cents: number): string {
  return new Intl.NumberFormat("fr-FR", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(
    Math.round(cents) / 100,
  );
}
