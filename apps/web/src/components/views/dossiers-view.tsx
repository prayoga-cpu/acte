"use client";

import { useState } from "react";
import type { DossierStatus, DossierUsage } from "@acte/contracts";
import { fmtMin } from "@/lib/format";
import { useI18n, type Dictionary } from "@/i18n/locale-context";
import { DossierMenu } from "@/components/dossiers/dossier-menu";
import { BudgetModal } from "@/components/dossiers/budget-modal";
import { NewDossierModal } from "@/components/dossiers/new-dossier-modal";

function fmtActivity(iso: string | null, t: Dictionary): string {
  if (!iso) return t.dossiers.noActivity;
  const fmt = new Intl.DateTimeFormat("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "Europe/Paris" });
  return fmt.format(new Date(iso)).replace(":", " h ");
}

function StatusBadge({ status, t }: { status: DossierStatus; t: Dictionary }) {
  if (status === "ready") {
    return <span className="shrink-0 rounded-full border border-gold/35 bg-gold/10 px-2.5 py-1 text-[10.5px] font-semibold text-gold-pale">{t.dossiers.statusReady}</span>;
  }
  if (status === "archived") {
    return <span className="shrink-0 rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[10.5px] text-ash">{t.dossiers.statusArchived}</span>;
  }
  return <span className="shrink-0 rounded-full border border-white/[0.1] bg-white/[0.04] px-2.5 py-1 text-[10.5px] text-ash">{t.dossiers.statusProgress}</span>;
}

export function DossiersView({
  dossiers,
  onCreate,
  onUpdateBudget,
  onSetStatus,
  onGoToPending,
}: {
  dossiers: DossierUsage[];
  onCreate: (input: { name: string; clientLabel: string; budgetMinutes: number | null }) => Promise<void>;
  onUpdateBudget: (id: string, budgetMinutes: number) => Promise<void>;
  onSetStatus: (id: string, status: DossierStatus) => Promise<void>;
  onGoToPending: () => void;
}) {
  const { t } = useI18n();
  const [newDossierOpen, setNewDossierOpen] = useState(false);
  const [budgetTarget, setBudgetTarget] = useState<DossierUsage | null>(null);

  const totalMin = dossiers.filter((d) => d.status !== "archived").reduce((s, d) => s + d.usedMinutes, 0);

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">{t.dossiers.activeEyebrow}</p>
          <h2 className="mt-1 font-display text-[16px] font-extrabold uppercase tracking-[0.05em] text-ivory">{t.dossiers.activeHeading}</h2>
        </div>
        <div className="flex items-center gap-3">
          <p className="font-mono text-[12px] text-gold-pale">{fmtMin(totalMin)} {t.dossiers.capturedThisMonth}</p>
          <button
            type="button"
            onClick={() => setNewDossierOpen(true)}
            className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-3.5 py-1.5 text-[12px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
          >
            + {t.dossiers.newDossier}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        {dossiers.map((d) => {
          const time = d.usedMinutes;
          const budget = d.budgetMinutes ?? 0;
          const pct = budget > 0 ? Math.min(100, Math.round((time / budget) * 100)) : 0;
          const archived = d.status === "archived";
          return (
            <section key={d.id} className={`glass fade-up p-5 transition hover:-translate-y-0.5 hover:border-gold/25 ${archived ? "opacity-55" : ""}`}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="truncate font-display text-[19px] font-semibold text-ivory">{d.name}</h3>
                  <p className="mt-0.5 text-[11.5px] text-ash">{d.clientLabel}</p>
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <StatusBadge status={d.status} t={t} />
                  <DossierMenu
                    dossier={d}
                    onEditBudget={() => setBudgetTarget(d)}
                    onSetStatus={(status) => onSetStatus(d.id, status)}
                  />
                </div>
              </div>
              <p className="mt-4 eyebrow">{t.dossiers.aiCapturedThisMonth}</p>
              <p className="mt-1 font-mono text-[22px] text-ivory">{fmtMin(time)}</p>
              {budget > 0 ? (
                <>
                  <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/[0.07]">
                    <div
                      className={`h-full rounded-full ${pct >= 90 ? "bg-gradient-to-r from-amber-500 to-gold" : "bg-gradient-to-r from-gold-pale to-gold-deep"}`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <p className="mt-1.5 font-mono text-[11px] text-ash">
                    {fmtMin(time)} / {fmtMin(budget)} · {pct} {t.dossiers.percentOfBudget}
                  </p>
                </>
              ) : (
                <p className="mt-1.5 font-mono text-[11px] text-ash">{t.dossiers.noBudget}</p>
              )}
              <div className="mt-4 flex items-center justify-between border-t border-white/[0.05] pt-3">
                <span className="text-[11.5px] text-ash">{t.dossiers.lastActivity} · {fmtActivity(d.lastActivityAt, t)}</span>
                {archived ? (
                  <span className="text-[11.5px] text-ash">{t.dossiers.captureSuspended}</span>
                ) : d.pendingMinutes > 0 ? (
                  <button onClick={onGoToPending} className="text-[11.5px] font-medium text-amber-300 transition hover:text-amber-200">
                    ● {fmtMin(d.pendingMinutes)} {t.dossiers.toValidateArrow}
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-[11.5px] text-emerald-300">
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                    {t.dossiers.upToDateJournal}
                  </span>
                )}
              </div>
            </section>
          );
        })}
      </div>

      {newDossierOpen && <NewDossierModal onClose={() => setNewDossierOpen(false)} onCreate={onCreate} />}
      {budgetTarget && (
        <BudgetModal
          dossier={budgetTarget}
          onClose={() => setBudgetTarget(null)}
          onSave={(minutes) => onUpdateBudget(budgetTarget.id, minutes)}
        />
      )}
    </div>
  );
}
