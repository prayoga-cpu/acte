"use client";

import { useState } from "react";
import type { Dossier, Task } from "@acte/contracts";
import { fmtMin } from "@/lib/format";
import { fr } from "@/i18n/fr";
import { ManualEntryModal } from "./manual-entry-modal";
import { TaskRow } from "./task-row";

export function JournalCard({
  tasks,
  dossiers,
  focused,
  onValidate,
  onValidateAll,
  onReassign,
  onCreateManualTask,
}: {
  tasks: Task[];
  dossiers: Dossier[];
  focused: boolean;
  onValidate: (id: string) => void;
  onValidateAll: () => void;
  onReassign: (id: string, dossierId: string) => void;
  onCreateManualTask: (input: { title: string; dossierId: string | null; startedAt: string; durationMin: number }) => Promise<void>;
}) {
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const pending = tasks.filter((t) => t.status === "pending");
  const pendingMin = pending.reduce((s, t) => s + t.durationMin, 0);
  const today = new Intl.DateTimeFormat("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(
    new Date(),
  );

  return (
    <section className="glass fade-up flex w-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <p className="eyebrow">{fr.journal.title}</p>
          <h2 className="mt-1 font-display text-[15px] font-extrabold uppercase tracking-[0.05em] text-ivory">{today}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 font-mono text-[11px] text-gold-pale">
            {pending.length === 0 ? "À jour ✓" : fr.journal.pendingPill(pending.length)}
          </span>
          <button
            type="button"
            onClick={() => setManualEntryOpen(true)}
            title={fr.journal.manualEntry}
            aria-label={fr.journal.manualEntry}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-ash transition hover:border-gold/30 hover:text-gold-pale"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <div
        className="scroll-thin relative flex-1 overflow-y-auto"
        style={{ maxHeight: focused ? "64vh" : "clamp(280px, 44vh, 560px)", minHeight: 240 }}
      >
        <div>
          {pending.map((t) => (
            <TaskRow key={t.id} task={t} dossiers={dossiers} onValidate={onValidate} onReassign={onReassign} />
          ))}
        </div>

        {pending.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/35 bg-gold/10">
              <svg className="text-gold-pale" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="font-display text-[16px] font-extrabold uppercase tracking-[0.04em] text-ivory">{fr.journal.emptyTitle}</p>
            <p className="max-w-[300px] text-[13px] text-ash">{fr.journal.emptyBody}</p>
          </div>
        )}

        {pending.length >= 2 && (
          <div className="glass-soft sticky bottom-3 mx-3 mt-2 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gold/25 px-4 py-2.5 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] sm:mx-4">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-gold pulse-gold" />
              <span className="text-[13px] text-ivory/90">{fr.journal.batchLabel(pending.length, fmtMin(pendingMin))}</span>
            </div>
            <button
              onClick={onValidateAll}
              className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-1.5 text-[13px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
            >
              {fr.journal.validateAll}
            </button>
          </div>
        )}
      </div>

      {manualEntryOpen && (
        <ManualEntryModal
          dossiers={dossiers}
          onClose={() => setManualEntryOpen(false)}
          onSubmit={onCreateManualTask}
        />
      )}
    </section>
  );
}
