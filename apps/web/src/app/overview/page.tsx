"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/locale-context";
import { LandingNavbar } from "@/components/marketing/navbar";
import { LandingFooter } from "@/components/marketing/footer";

export default function OverviewPage() {
  const { t } = useI18n();
  const p = t.overview;

  return (
    <div className="scroll-thin relative z-10 h-[100dvh] overflow-y-auto overflow-x-hidden">
      <LandingNavbar />

      <main>
        {/* Intro */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="fade-up max-w-[62ch]">
            <p className="eyebrow">{p.intro.eyebrow}</p>
            <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.1] tracking-tight text-ivory sm:text-[40px]">
              {p.intro.title}
            </h1>
            <p className="mt-5 max-w-[56ch] text-[15px] leading-relaxed text-ash">{p.intro.body}</p>
          </div>
        </section>

        {/* Journal */}
        <section id="journal" className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="fade-up">
            <h2 className="font-display text-[24px] font-bold leading-tight text-ivory sm:text-[28px]">
              {p.journal.title}
            </h2>
            <p className="mt-4 max-w-[48ch] text-[14px] leading-relaxed text-ash">{p.journal.body}</p>
          </div>
          <div className="fade-up glass p-5 sm:p-6">
            <p className="text-[11px] uppercase tracking-[0.08em] text-ash">{p.previewCaption}</p>
            <div className="mt-4 space-y-2">
              {p.journal.rows.map((row) => (
                <div key={row.label} className="task-row flex items-center justify-between rounded-xl px-3 py-2.5">
                  <span className="truncate text-[12.5px] text-ivory/85">{row.label}</span>
                  <span className="ml-3 flex shrink-0 items-center gap-2">
                    <span className="rounded-full border border-white/[0.1] px-2 py-0.5 text-[10.5px] text-ash">
                      {row.confidence}%
                    </span>
                    <span className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-2.5 py-0.5 text-[10.5px] font-semibold text-noir">
                      {t.journal.validate}
                    </span>
                  </span>
                </div>
              ))}
            </div>
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <span className="rounded-full border border-white/[0.12] px-4 py-2 text-[12px] text-ivory/85">
                {t.journal.validateAll}
              </span>
            </div>
          </div>
        </section>

        {/* Dossiers */}
        <section id="dossiers" className="border-y border-white/[0.06] bg-white/[0.015] py-16">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="fade-up max-w-[56ch]">
              <h2 className="font-display text-[24px] font-bold leading-tight text-ivory sm:text-[28px]">
                {p.dossiers.title}
              </h2>
              <p className="mt-4 text-[14px] leading-relaxed text-ash">{p.dossiers.body}</p>
            </div>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              {p.dossiers.cards.map((d) => (
                <div key={d.name} className="glass-soft fade-up rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="font-display text-[14.5px] font-semibold text-ivory">
                      {p.dossiers.dossierLabel} {d.name}
                    </h3>
                    <span className="rounded-full border border-white/[0.1] px-2 py-0.5 text-[10px] text-ash">
                      {d.status}
                    </span>
                  </div>
                  <p className="mt-3 text-[11px] text-ash">{p.dossiers.usedOfBudget(d.used)}</p>
                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold to-gold-deep"
                      style={{ width: `${d.used}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Statistiques */}
        <section id="statistiques" className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="fade-up lg:order-2">
            <h2 className="font-display text-[24px] font-bold leading-tight text-ivory sm:text-[28px]">
              {p.stats.title}
            </h2>
            <p className="mt-4 max-w-[48ch] text-[14px] leading-relaxed text-ash">{p.stats.body}</p>
          </div>
          <div className="fade-up glass p-5 sm:p-6 lg:order-1">
            <p className="text-[11px] uppercase tracking-[0.08em] text-ash">{p.previewCaption}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="glass-soft rounded-2xl p-4">
                <p className="text-[11px] text-ash">{p.stats.securedThisMonth}</p>
                <p className="mt-1.5 font-display text-[20px] font-bold text-ivory">12 480 €</p>
              </div>
              <div className="glass-soft rounded-2xl p-4">
                <p className="text-[11px] text-ash">{p.stats.averageRate}</p>
                <p className="mt-1.5 font-display text-[20px] font-bold text-ivory">220 €/h</p>
              </div>
            </div>
            <div className="mt-3 space-y-2">
              {p.stats.sources.map((s) => (
                <div key={s.label} className="flex items-center gap-3">
                  <span className="w-24 shrink-0 text-[12px] text-ash">{s.label}</span>
                  <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div className="h-full rounded-full bg-white/25" style={{ width: `${s.pct}%` }} />
                  </div>
                  <span className="w-9 shrink-0 text-right text-[11px] text-ash">{s.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Facturation */}
        <section id="facturation" className="border-y border-white/[0.06] bg-white/[0.015] py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div className="fade-up">
              <h2 className="font-display text-[24px] font-bold leading-tight text-ivory sm:text-[28px]">
                {p.billing.title}
              </h2>
              <p className="mt-4 max-w-[48ch] text-[14px] leading-relaxed text-ash">{p.billing.body}</p>
            </div>
            <div className="fade-up glass p-5 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.08em] text-ash">{p.previewCaption}</p>
              <div className="mt-4 glass-soft rounded-2xl p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] text-ivory/85">{p.billing.invoiceLabel}</span>
                  <span className="rounded-full border border-white/[0.1] px-2 py-0.5 text-[10.5px] text-ash">
                    {p.billing.draftBadge}
                  </span>
                </div>
                <p className="mt-2 text-[11px] text-ash">{p.billing.generatedFrom}</p>
              </div>
              <div className="mt-3 flex items-center justify-between rounded-xl border border-white/[0.08] px-3 py-2.5">
                <span className="text-[12px] text-ash">{p.billing.csvFile}</span>
                <span className="text-[10.5px] text-ash">{p.billing.exportCsv}</span>
              </div>
            </div>
          </div>
        </section>

        {/* Cloud & Synchronisation */}
        <section id="cloud-synchronisation" className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-2 lg:items-center">
          <div className="fade-up lg:order-2">
            <h2 className="font-display text-[24px] font-bold leading-tight text-ivory sm:text-[28px]">
              {p.cloud.title}
            </h2>
            <p className="mt-4 max-w-[48ch] text-[14px] leading-relaxed text-ash">{p.cloud.body}</p>
          </div>
          <div className="fade-up glass p-5 sm:p-6 lg:order-1">
            <p className="text-[11px] uppercase tracking-[0.08em] text-ash">{p.previewCaption}</p>
            <div className="mt-4 space-y-2">
              {p.cloud.devices.map((device) => (
                <div key={device.name} className="task-row flex items-center justify-between rounded-xl px-3 py-2.5">
                  <span className="truncate text-[12.5px] text-ivory/85">{device.name}</span>
                  <span className="ml-3 shrink-0 text-[10.5px] text-ash">{device.lastSeen}</span>
                </div>
              ))}
              <div className="task-row flex items-center justify-between rounded-xl px-3 py-2.5">
                <span className="truncate text-[12.5px] text-ivory/85">{p.cloud.companionRow}</span>
                <span className="ml-3 shrink-0 rounded-full border border-white/[0.12] px-2.5 py-0.5 text-[10.5px] text-ash">
                  {t.comingSoon}
                </span>
              </div>
            </div>
            <div className="mt-4 border-t border-white/[0.06] pt-4">
              <span className="rounded-full border border-white/[0.12] px-4 py-2 text-[12px] text-ivory/85">
                {p.cloud.generateKey}
              </span>
            </div>
          </div>
        </section>

        {/* Le Cerveau d'ACTE */}
        <section id="cerveau" className="border-y border-white/[0.06] bg-white/[0.015] py-16">
          <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
            <div className="fade-up">
              <h2 className="font-display text-[24px] font-bold leading-tight text-ivory sm:text-[28px]">
                {p.brain.title}
              </h2>
              <p className="mt-4 max-w-[48ch] text-[14px] leading-relaxed text-ash">{p.brain.body}</p>
            </div>
            <div className="fade-up glass p-5 sm:p-6">
              <p className="text-[11px] uppercase tracking-[0.08em] text-ash">{p.previewCaption}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="glass-soft rounded-2xl p-4">
                  <p className="text-[11px] text-ash">{p.brain.pendingTasks}</p>
                  <p className="mt-1.5 font-display text-[22px] font-bold text-ivory">3</p>
                </div>
                <div className="glass-soft rounded-2xl p-4">
                  <p className="text-[11px] text-ash">{p.brain.lowConfidence}</p>
                  <p className="mt-1.5 font-display text-[22px] font-bold text-ivory">1</p>
                </div>
              </div>
              <div className="mt-3 rounded-xl border border-white/[0.08] px-3 py-2.5 text-[12px] leading-relaxed text-ash">
                {p.brain.sampleInsight}
              </div>
            </div>
          </div>
        </section>

        {/* CTA banner */}
        <section className="py-20">
          <div className="glass fade-up mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-12 text-center sm:px-10">
            <h2 className="font-display text-[24px] font-bold leading-tight text-ivory sm:text-[28px]">
              {p.cta.title}
            </h2>
            <p className="max-w-[42ch] text-[14px] text-ash">{p.cta.subtitle}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-7 py-3 text-[13.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
              >
                {p.cta.primary}
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/[0.12] px-7 py-3 text-[13.5px] text-ivory/85 transition hover:border-gold/35 hover:text-gold-pale"
              >
                {p.cta.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
