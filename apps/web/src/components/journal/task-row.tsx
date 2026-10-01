"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
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
 *
 * The "•••" menu (edit, delete) is not in the prototype: it was added so a
 * mistaken entry can be fixed (D-018), in the same visual language as the
 * dossier chip's menu.
 */
export function TaskRow({
  task,
  dossiers,
  dateLabel,
  leaving = false,
  flash = 0,
  showActions = true,
  onValidate,
  onReassign,
  onEdit,
  onDelete,
}: {
  task: Task;
  dossiers: Dossier[];
  /** Shown before the time range on rows from an earlier day. */
  dateLabel?: string;
  /** Prototype validateTask: the row slides out while the validation is saved. */
  leaving?: boolean;
  /** Changes each time the row should flash (prototype flashRow); 0 = never. */
  flash?: number;
  /** The edit/delete menu. Off on Home, whose narrower card keeps the prototype's row exactly. */
  showActions?: boolean;
  onValidate: (id: string) => void;
  onReassign: (id: string, dossierId: string) => void;
  onEdit: (task: Task) => void;
  onDelete: (task: Task) => void;
}) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const actionsRef = useRef<HTMLDivElement>(null);
  const rowRef = useRef<HTMLElement>(null);
  useOutsideClick(menuRef, () => setMenuOpen(false), menuOpen);
  useOutsideClick(actionsRef, () => setActionsOpen(false), actionsOpen);

  // `.leaving` animates max-height down to 0, so the row needs its real height as the starting point
  // (prototype validateTask: set the height, force a reflow, then add the class). Two steps here too:
  // measure when `leaving` turns on, and only then apply the class.
  const [collapsing, setCollapsing] = useState(false);
  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row) return;
    if (!leaving) {
      row.style.maxHeight = "";
      setCollapsing(false);
      return;
    }
    row.style.maxHeight = `${row.offsetHeight}px`;
    void row.offsetWidth;
    setCollapsing(true);
  }, [leaving]);

  // Prototype flashRow: scroll the row into view and replay the gold flash.
  useEffect(() => {
    const row = rowRef.current;
    if (!flash || !row) return;
    row.scrollIntoView({ behavior: "smooth", block: "center" });
    row.classList.remove("flash");
    void row.offsetWidth;
    row.classList.add("flash");
  }, [flash]);

  const dossierName = dossiers.find((d) => d.id === task.dossierId)?.name ?? t.journal.unassigned;

  return (
    <article ref={rowRef} className={`task-row group ${collapsing ? "leaving" : ""}`}>
      <div className="row-main flex items-center gap-3 px-5 py-3.5">
        <SourceBadge source={task.source} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13.5px] font-medium text-ivory/95">{task.title}</p>
          <p className="mt-0.5 font-mono text-[11px] text-ash">
            {dateLabel && <span className="text-amber-300/90">{dateLabel} · </span>}
            {fmtTimeRange(task.startedAt, task.endedAt)} · <span className="text-ivory/70">{fmtMin(task.durationMin)}</span>
          </p>
        </div>
        <div ref={menuRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            title={t.journal.editDossier}
            data-tour="task-dossier"
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
        <ConfidenceBadge confidence={task.confidence} corrected={task.corrected} />
        <button
          onClick={() => onValidate(task.id)}
          aria-label={`${t.journal.validate} ${task.title}`}
          data-tour="task-validate"
          className="validate-btn flex shrink-0 items-center gap-1.5 rounded-full border border-emerald-400/25 px-3 py-1.5 text-[12px] font-semibold text-emerald-300 opacity-60 transition hover:bg-emerald-400/15 group-hover:opacity-100"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 6 9 17l-5-5" />
          </svg>
          {t.journal.validate}
        </button>
        {showActions && (
        <div ref={actionsRef} className="relative shrink-0">
          <button
            type="button"
            onClick={() => setActionsOpen((v) => !v)}
            aria-label={t.journal.taskActionsAria(task.title)}
            aria-haspopup="menu"
            data-tour="task-menu"
            className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-ash transition hover:border-gold/35 hover:text-gold-pale"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <circle cx="5" cy="12" r="1.8" />
              <circle cx="12" cy="12" r="1.8" />
              <circle cx="19" cy="12" r="1.8" />
            </svg>
          </button>
          {actionsOpen && (
            <div
              role="menu"
              className="dossier-menu fade-up absolute right-0 top-[calc(100%+6px)] z-30 w-[190px] overflow-hidden rounded-xl border border-white/[0.1] bg-carbon/95 shadow-[0_14px_40px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl"
            >
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActionsOpen(false);
                  onEdit(task);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] text-ivory/90 transition hover:bg-white/[0.05]"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
                </svg>
                {t.journal.editTask}
              </button>
              <button
                type="button"
                role="menuitem"
                onClick={() => {
                  setActionsOpen(false);
                  onDelete(task);
                }}
                className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] text-red-400 transition hover:bg-red-500/10"
              >
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18" />
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                </svg>
                {t.journal.deleteTask}
              </button>
            </div>
          )}
        </div>
        )}
      </div>
    </article>
  );
}

/** A validated task of the day shown: read-only, with "Annuler" to put it back to pending (D-018). */
export function ValidatedRow({ task, dossiers, onUnvalidate }: { task: Task; dossiers: Dossier[]; onUnvalidate: (id: string) => void }) {
  const { t } = useI18n();
  const dossierName = dossiers.find((d) => d.id === task.dossierId)?.name ?? t.journal.unassigned;
  return (
    <article className="task-row">
      <div className="row-main flex items-center gap-3 px-5 py-3 opacity-80">
        <SourceBadge source={task.source} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[13px] text-ivory/85">{task.title}</p>
          <p className="mt-0.5 truncate font-mono text-[11px] text-ash">
            {fmtTimeRange(task.startedAt, task.endedAt)} · <span className="text-ivory/70">{fmtMin(task.durationMin)}</span> · {dossierName}
          </p>
        </div>
        {task.invoiceId ? (
          <span className="shrink-0 rounded-full border border-gold/25 bg-gold/10 px-2 py-0.5 font-mono text-[10.5px] text-gold-pale">{t.journal.invoiced}</span>
        ) : (
          <button
            type="button"
            onClick={() => onUnvalidate(task.id)}
            aria-label={`${t.journal.unvalidate} ${task.title}`}
            className="shrink-0 rounded-full border border-white/[0.12] px-3 py-1 text-[11.5px] text-ivory/80 transition hover:border-gold/35 hover:text-gold-pale"
          >
            {t.journal.unvalidate}
          </button>
        )}
      </div>
    </article>
  );
}
