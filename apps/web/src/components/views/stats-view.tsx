"use client";

import type { StatsSummary, TaskSource } from "@acte/contracts";
import { fmtEurFromCents } from "@/lib/format";
import { SourceBadge } from "@/components/journal/source-badge";

const SOURCE_LABEL: Record<TaskSource, string> = { word: "Word", outlook: "Outlook", web: "Navigateur", manual: "Saisie manuelle" };

export function StatsView({
  stats,
  averageRateCents,
  onGoToJournal,
}: {
  stats: StatsSummary;
  averageRateCents: number;
  onGoToJournal: () => void;
}) {
  const maxRevenue = Math.max(1, ...stats.months.map((m) => m.revenueCents));
  const totalSourceMin = stats.sourceBreakdown.reduce((s, b) => s + b.minutes, 0) || 1;
  const currentMonth = stats.months[stats.months.length - 1];

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="mb-4">
        <p className="eyebrow">Statistiques</p>
        <h2 className="mt-1 font-display text-[16px] font-extrabold uppercase tracking-[0.05em] text-ivory">Ce qu&rsquo;ACTE vous a rapporté</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="glass fade-up p-5 md:col-span-2 md:row-span-2">
          <p className="eyebrow">CA sécurisé par mois</p>
          <div className="mt-5 flex h-[210px] items-end justify-between gap-3 px-1">
            {stats.months.map((m, i) => {
              const isNow = i === stats.months.length - 1;
              return (
                <div key={m.label + i} className="flex flex-1 flex-col items-center gap-1.5">
                  <span className={`font-mono text-[9.5px] ${isNow ? "text-gold-pale" : "text-ash/80"}`}>{Math.round(m.revenueCents / 100000)}k</span>
                  <div
                    className={`bar w-full rounded-t-md ${isNow ? "bg-gradient-to-t from-gold-deep to-gold-pale" : "bg-gold/25"}`}
                    style={{ height: `${Math.max(6, Math.round((m.revenueCents / maxRevenue) * 100))}%` }}
                    title={fmtEurFromCents(m.revenueCents)}
                  />
                  <span className={`text-[10px] ${isNow ? "font-semibold text-gold-pale" : "text-ash"}`}>{m.label}</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass fade-up p-5">
          <p className="eyebrow">Taux horaire</p>
          <p className="mt-2 font-display text-[25px] font-bold leading-none tracking-tight text-gold-grad">{fmtEurFromCents(averageRateCents)}</p>
          <p className="mt-[22px] text-[12px] text-ash">appliqué aux temps validés</p>
        </section>

        <section className="glass fade-up p-5">
          <p className="eyebrow">CA sécurisé ce mois-ci</p>
          <p className="mt-2 font-display text-[25px] font-bold leading-none tracking-tight text-ivory">
            {currentMonth ? fmtEurFromCents(currentMonth.revenueCents) : "—"}
          </p>
          <p className="mt-[22px] text-[12px] text-ash">temps validé uniquement</p>
        </section>

        <section className="glass fade-up p-5 md:col-span-3">
          <p className="eyebrow">Répartition par source</p>
          <div className="mt-4 space-y-3.5">
            {stats.sourceBreakdown.length === 0 && <p className="text-[12.5px] text-ash">Pas encore de temps validé ce mois-ci.</p>}
            {stats.sourceBreakdown.map((b) => {
              const pct = Math.round((b.minutes / totalSourceMin) * 100);
              return (
                <div key={b.source} className="flex items-center gap-3">
                  <SourceBadge source={b.source} size={6} />
                  <span className="w-24 shrink-0 text-[12.5px] text-ivory/90">{SOURCE_LABEL[b.source]}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/[0.06]">
                    <div className="hbar h-full rounded-full bg-gradient-to-r from-gold-pale to-gold-deep" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="w-10 shrink-0 text-right font-mono text-[11.5px] text-gold-pale">{pct} %</span>
                </div>
              );
            })}
          </div>
        </section>

        <section className="glass fade-up p-5 md:col-span-3">
          <p className="eyebrow">L&rsquo;enjeu du temps invisible</p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <div className="min-w-[260px] flex-1">
              <p className="font-display text-[30px] font-extrabold leading-none tracking-tight text-gold-grad">
                {fmtEurFromCents(Math.round(averageRateCents * 0.5 * 210))} / an
              </p>
              <p className="mt-2 max-w-[600px] text-[12px] leading-relaxed text-ash">
                C&rsquo;est ce que représentent <b className="text-ivory/90">30 minutes de temps oublié par jour</b> sur 210 jours facturables, à votre
                taux de <span className="font-mono">{fmtEurFromCents(averageRateCents)} / h</span>. ACTE capture précisément ce temps que personne ne
                saisit à la main.
              </p>
            </div>
            <button
              type="button"
              onClick={onGoToJournal}
              className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-2 text-[12.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
            >
              Voir mon journal →
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
