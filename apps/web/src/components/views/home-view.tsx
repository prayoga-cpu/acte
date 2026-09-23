"use client";

import type { Dossier, HomeSummary, Task, WeekSummary } from "@acte/contracts";
import { fmtEurFromCents, fmtMin } from "@/lib/format";
import { useI18n } from "@/i18n/locale-context";
import { JournalCard } from "@/components/journal/journal-card";

export function HomeView({
  summary,
  week,
  tasks,
  dossiers,
  averageRateCents,
  onValidate,
  onValidateAll,
  onReassign,
  onCreateManualTask,
}: {
  summary: HomeSummary;
  week: WeekSummary;
  tasks: Task[];
  dossiers: Dossier[];
  averageRateCents: number;
  onValidate: (id: string) => void;
  onValidateAll: () => void;
  onReassign: (id: string, dossierId: string) => void;
  onCreateManualTask: (input: { title: string; dossierId: string | null; startedAt: string; durationMin: number }) => Promise<void>;
}) {
  const { t } = useI18n();
  const progressPct = summary.capturedTodayMin > 0 ? Math.round((summary.validatedTodayMin / summary.capturedTodayMin) * 100) : 0;
  const scale = Math.max(460, ...week.days.map((d) => d.minutes));
  const todayLabelIndex = new Date().getDay() === 0 ? 6 : new Date().getDay() - 1;

  return (
    <div className="mx-auto grid max-w-[1080px] grid-cols-1 gap-4 md:grid-cols-3">
      <section className="glass fade-up p-5">
        <p className="eyebrow">{t.home.capturedToday}</p>
        <p className="mt-2 font-display text-[25px] font-bold leading-none tracking-tight text-ivory">{fmtMin(summary.capturedTodayMin)}</p>
        <div className="mt-3.5 h-1 overflow-hidden rounded-full bg-white/[0.07]">
          <div className="h-full rounded-full bg-gradient-to-r from-gold-pale to-gold-deep transition-all duration-700" style={{ width: `${progressPct}%` }} />
        </div>
        <p className="mt-2 text-[12px] text-ash">
          <span className="font-mono text-gold-pale">{fmtMin(summary.validatedTodayMin)}</span> {t.home.validatedSuffix} ·{" "}
          <span className="font-mono">{fmtMin(summary.pendingTodayMin)}</span> {t.home.pendingSuffix}
        </p>
      </section>

      <section className="glass fade-up relative p-5" style={{ animationDelay: "0.06s" }}>
        <p className="eyebrow">{t.home.securedRevenue}</p>
        <p className="mt-2 font-display text-[25px] font-bold leading-none tracking-tight text-gold-grad">{fmtEurFromCents(summary.securedRevenueMonthCents)}</p>
        <p className="mt-[26px] text-[12px] text-ash">
          {t.home.averageRatePrefix} <span className="font-mono">{fmtEurFromCents(averageRateCents)}</span>
        </p>
      </section>

      <section className="glass fade-up p-5" style={{ animationDelay: "0.12s" }}>
        <p className="eyebrow">{t.home.roi}</p>
        <p className="mt-2 font-display text-[25px] font-bold leading-none tracking-tight text-ivory">
          {summary.roiMinutesToday}
          <span className="text-[20px] text-ash"> min</span>
        </p>
        <p className="mt-[26px] text-[12px] text-ash">{t.home.roiSuffix}</p>
      </section>

      <div className="flex md:col-span-2 md:row-span-2">
        <JournalCard
          tasks={tasks}
          dossiers={dossiers}
          focused={false}
          onValidate={onValidate}
          onValidateAll={onValidateAll}
          onReassign={onReassign}
          onCreateManualTask={onCreateManualTask}
        />
      </div>

      <section className="glass fade-up p-5" style={{ animationDelay: "0.24s" }}>
        <div className="flex items-baseline justify-between">
          <p className="eyebrow">{t.home.weeklyChart}</p>
          <p className="font-mono text-[12px] text-gold-pale">{fmtMin(week.totalMin)}</p>
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

      <section className="glass fade-up p-5" style={{ animationDelay: "0.3s" }}>
        <p className="eyebrow">{t.home.passiveCapture}</p>
        <ul className="mt-3.5 space-y-2.5 text-[13px]">
          {(["word", "outlook", "web"] as const).map((src) => (
            <li key={src} className="flex items-center gap-2.5">
              <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] text-ash">
                {src === "word" ? "W" : src === "outlook" ? "O" : "◐"}
              </span>
              <span className="text-ivory/90">{src === "word" ? t.settingsView.wordName : src === "outlook" ? t.settingsView.outlookName : t.settingsView.webName}</span>
              <span className="ml-auto flex items-center gap-1.5 font-mono text-[11px] text-ash">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400 pulse-dot" />
                {t.home.activeStatus}
              </span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
