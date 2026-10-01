"use client";

import { parisDateKey } from "@acte/contracts";
import type { Dossier, HomeSummary, SourceSettings, Task, WeekSummary } from "@acte/contracts";
import { fmtEurFromCents, fmtMin } from "@/lib/format";
import { useAnimatedNumber } from "@/lib/use-animated-number";
import { useI18n } from "@/i18n/locale-context";
import { JournalCard, type JournalActions } from "@/components/journal/journal-card";
import { SourceBadge } from "@/components/journal/source-badge";

/** Prototype updateKpis: a figure rolls to its new value. Its own component, so only it re-renders on each frame. */
function Rolling({ value, format }: { value: number; format: (v: number) => string }) {
  return <>{format(useAnimatedNumber(value))}</>;
}

/** Monday of the current Paris week, for "semaine du 6 juillet". */
function mondayOfThisWeek(): Date {
  const [y, m, d] = parisDateKey(new Date()).split("-").map(Number) as [number, number, number];
  const noon = new Date(Date.UTC(y, m - 1, d, 12));
  const weekday = noon.getUTCDay() === 0 ? 6 : noon.getUTCDay() - 1;
  noon.setUTCDate(noon.getUTCDate() - weekday);
  return noon;
}

export function HomeView({
  summary,
  week,
  tasks,
  backlog,
  dateKey,
  dossiers,
  sources,
  averageRateCents,
  gain,
  flash,
  actions,
}: {
  summary: HomeSummary;
  week: WeekSummary;
  tasks: Task[];
  backlog: Task[];
  dateKey: string;
  dossiers: Dossier[];
  sources: SourceSettings;
  averageRateCents: number;
  /** The "+359 €" that floats up on the CA card after a validation (prototype floatGain). */
  gain: { text: string; seq: number } | null;
  flash?: { dossierId: string; seq: number } | null;
  actions: JournalActions;
}) {
  const { t, locale } = useI18n();
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR";
  const progressPct = summary.capturedTodayMin > 0 ? Math.round((summary.validatedTodayMin / summary.capturedTodayMin) * 100) : 0;
  const scale = Math.max(460, ...week.days.map((d) => d.minutes));
  const todayLabelIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  const monthLabel = new Intl.DateTimeFormat(dateLocale, { month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(new Date());
  const weekStart = new Intl.DateTimeFormat(dateLocale, { day: "numeric", month: "long", timeZone: "UTC" }).format(mondayOfThisWeek());

  return (
    <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-4 md:grid-cols-3">
      <section className="glass fade-up p-5" data-tour="home-kpis">
        <p className="eyebrow">{t.home.capturedToday}</p>
        <p className="mt-2 font-display text-[25px] font-bold leading-none tracking-tight text-ivory">{fmtMin(summary.capturedTodayMin)}</p>
        <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-pale to-gold-deep transition-all duration-700" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-2 text-[12px] text-ash">
          <span className="font-mono text-gold-pale">
            <Rolling value={summary.validatedTodayMin} format={(v) => fmtMin(Math.round(v))} />
          </span> {t.home.validatedSuffix} ·{" "}
          <span className="font-mono">{fmtMin(summary.pendingTodayMin)}</span> {t.home.pendingSuffix}
        </p>
      </section>

      {/* Keyed by the gain so the glow replays on every validation (prototype floatGain). */}
      <section key={gain?.seq ?? 0} className={`glass relative p-5 ${gain ? "kpi-glow" : "fade-up"}`} style={{ animationDelay: gain ? undefined : "0.06s" }} data-tour="home-kpis">
        <p className="eyebrow">{t.home.securedRevenue}</p>
        <p className="mt-2 font-display text-[25px] font-bold leading-none tracking-tight text-gold-grad">
          <Rolling value={summary.securedRevenueMonthCents} format={fmtEurFromCents} />
        </p>
        <p className="mt-[26px] text-[12px] text-ash">
          <span className="capitalize">{monthLabel}</span> · {t.home.averageRatePrefix} <span className="font-mono">{fmtEurFromCents(averageRateCents)}</span>
        </p>
        {gain && <span className="float-gain pointer-events-none absolute right-4 top-3 font-mono text-[13px] font-semibold text-gold-pale">{gain.text}</span>}
      </section>

      <section className="glass fade-up p-5" style={{ animationDelay: "0.12s" }} data-tour="home-kpis">
        <p className="eyebrow">{t.home.roi}</p>
        <p className="mt-2 font-display text-[25px] font-bold leading-none tracking-tight text-ivory">
          <Rolling value={summary.roiMinutesToday} format={(v) => String(Math.round(v))} />
          <span className="text-[20px] text-ash"> min</span>
        </p>
        <p className="mt-[26px] text-[12px] text-ash">{t.home.roiSuffix}</p>
      </section>

      <div className="flex md:col-span-2 md:row-span-2" data-tour="home-journal">
        <JournalCard tasks={tasks} backlog={backlog} dateKey={dateKey} dossiers={dossiers} focused={false} flash={flash} actions={actions} />
      </div>

      <section className="glass fade-up p-5" style={{ animationDelay: "0.24s" }} data-tour="home-week">
        <div className="flex items-baseline justify-between gap-3">
          <p className="eyebrow">
            {t.home.weeklyChart} {weekStart}
          </p>
          <p className="shrink-0 whitespace-nowrap font-mono text-[12px] text-gold-pale">{fmtMin(week.totalMin)}</p>
        </div>
        <div className="mt-4 flex h-[110px] items-end justify-between gap-2 px-1" aria-label={t.home.weeklyChartAria}>
          {week.days.map((d, i) => {
            const isToday = i === todayLabelIndex;
            const h = d.minutes === 0 ? 4 : Math.max(6, Math.round((d.minutes / scale) * 100));
            return (
              <div key={d.label} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className={`bar w-full rounded-t-md ${d.minutes === 0 ? "bg-white/[0.05]" : isToday ? "bg-gradient-to-t from-gold-deep to-gold-pale" : "bg-gold/25"}`}
                  style={{ height: `${h}%` }}
                  title={d.minutes === 0 ? "—" : fmtMin(d.minutes)}
                />
                <span className={`whitespace-nowrap text-[9.5px] ${isToday ? "font-semibold text-gold-pale" : "text-ash"}`}>{d.label}</span>
              </div>
            );
          })}
        </div>
      </section>

      <section className="glass fade-up p-5" style={{ animationDelay: "0.3s" }} data-tour="home-capture">
        <p className="eyebrow">{t.home.passiveCapture}</p>
        {/* Prototype renderSources: a source switched off in Paramètres is dimmed and reads "En pause". Nothing
            captures yet (no Companion), so an enabled source says so rather than claiming to be active. */}
        <ul className="mt-3.5 space-y-2.5 text-[13px]">
          {(["word", "outlook", "web"] as const).map((src) => {
            const on = sources[src] ?? true;
            return (
              <li key={src} className={`flex items-center gap-2.5 ${on ? "" : "opacity-40"}`}>
                <SourceBadge source={src} size={6} />
                <span className="text-ivory/90">{src === "word" ? t.settingsView.wordName : src === "outlook" ? t.settingsView.outlookName : t.settingsView.webName}</span>
                <span className="ml-auto flex items-center gap-1.5 truncate font-mono text-[11px] text-ash">
                  <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white/25" />
                  {on ? t.home.awaitingCompanion : t.home.paused}
                </span>
              </li>
            );
          })}
        </ul>
      </section>
    </div>
  );
}
