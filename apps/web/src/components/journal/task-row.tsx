"use client";

import { useRef, useState } from "react";
import type { Dossier, Task } from "@acte/contracts";
import { fmtMin } from "@/lib/format";
import { fmtTimeRange } from "@/lib/format";
import { useI18n } from "@/i18n/locale-context";
import { useOutsideClick } from "@/lib/use-outside-click";
import { ConfidenceBadge } from "./confidence-badge";
import { SourceBadge } from "./source-badge";

/**
 * The prototype's row-detail panel shows the AI's "why" reasoning, quoting
 * filenames and correspondent addresses. That schema field is intentionally
 * absent until decision D-003 (docs/DECISIONS.md) is taken, so this row has
 * no expand affordance — nothing to show without inventing sensitive-looking
 * copy the backend doesn't actually have.
 */
export function TaskRow({
  task,
  dossiers,
  onValidate,
  onReassign,
}: {
  task: Task;
  dossiers: Dossier[];
  onValidate: (id: string) => void;
  onReassign: (id: string, dossierId: string) => void;
}) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen);

  const dossierName = dossiers.find((d) => d.id === task.dossierId)?.name ?? t.journal.unassigned;

  return (
    <article className="task-row group">
      <div className="row-main flex items-center gap-3 px-5 py-3.5">
        <SourceBadge source={task.source} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-ivory/95">{task.title}</p>
          <p className="mt-0.5 font-mono text-[11px] text-ash">
            {fmtTimeRange(task.startedAt, task.endedAt)} · <span className="text-ivory/70">{fmtMin(task.durationMin)}</span>
          </p>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            title={t.journal.editDossier}
            className="dossier-chip flex max-w-[180px] items-center gap-1.5 rounded-full border border-white/[0.09] bg-white/[0.03] px-2.5 py-1 text-[11.5px] text-ivory/85 transition hover:border-gold/35 hover:text-gold-pale"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
              <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z" />
            </svg>
            <span className="truncate">{dossierName}</span>
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          {menuOpen && (
            <div className="dossier-menu fade-up absolute right-0 top-[calc(100%+6px)] z-30 w-[230px] overflow-hidden rounded-xl border border-white/[0.1] bg-carbon/95 shadow-[0_14px_40px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl">
              <p className="border-b border-white/[0.06] px-3.5 py-2 text-[10px] uppercase tracking-[0.16em] text-ash">{t.journal.associateToDossier}</p>
              {dossiers.filter((d) => d.status !== "archived").map((d) => (
                <button
                  key={d.id}
                  onClick={() => {
                    setMenuOpen(false);
                    if (d.id !== task.dossierId) onReassign(task.id, d.id);
                  }}
                  className={`flex w-full items-center justify-between px-3.5 py-2 text-left text-[12.5px] transition hover:bg-gold/10 ${
                    d.id === task.dossierId ? "text-gold-pale" : "text-ivory/85"
                  }`}
                >
                  <span className="truncate">{d.name}</span>
                  {d.id === task.dossierId && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 6 9 17l-5-5" />
                    </svg>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>
        <ConfidenceBadge confidence={task.confidence} />
        <button
          onClick={() => onValidate(task.id)}
          aria-label={`${t.journal.validate} ${task.title}`}
          className="validate-btn flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/25 px-3 py-1.5 text-[12px] font-semibold text-emerald-300 opacity-60 transition hover:bg-emerald-400/15 group-hover:opacity-100"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {t.journal.validate}
        </button>
      </div>
    </article>
  );
}
