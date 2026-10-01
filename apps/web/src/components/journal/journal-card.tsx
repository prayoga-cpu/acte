"use client";

import { useEffect, useState } from "react";
import type { Dossier, Task } from "@acte/contracts";
import { shiftDateKey } from "@acte/contracts";
import { Modal, ModalActions, ModalCancelButton } from "@/components/modal";
import { fmtMin } from "@/lib/format";
import { dateKeyToDate, todayKeyParis } from "@/lib/time";
import { useI18n } from "@/i18n/locale-context";
import { ManualEntryModal, type TaskInput } from "./manual-entry-modal";
import { TaskRow, ValidatedRow } from "./task-row";

export interface JournalActions {
  onValidate: (id: string) => void | Promise<void>;
  onValidateAll: (ids: string[]) => void | Promise<void>;
  onReassign: (id: string, dossierId: string) => void;
  onCreateManualTask: (input: TaskInput) => Promise<void>;
  onUpdateTask: (id: string, patch: { title?: string; startedAt?: string; durationMin?: number; dossierId?: string }) => Promise<void>;
  onDeleteTask: (id: string) => void | Promise<void>;
  onUnvalidate: (id: string) => void | Promise<void>;
  /** Journal view only: move to another day. */
  onSetDate?: (dateKey: string) => void | Promise<void>;
}

const NAV_BUTTON =
  "flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-ash transition hover:border-gold/30 hover:text-gold-pale disabled:cursor-default disabled:opacity-35 disabled:hover:border-white/[0.08] disabled:hover:text-ash";

/**
 * The Journal card, shared by Home (today, compact) and the Journal view
 * (`focused`: any day, with the day's validated tasks).
 *
 * Not in the prototype, added under D-018 so the manual-entry loop is
 * usable: the day arrows, the carry-over list of earlier days' pending
 * tasks, the per-row edit/delete menu and the validated list with undo.
 */
export function JournalCard({
  tasks,
  backlog,
  dateKey,
  dossiers,
  focused,
  flash,
  actions,
}: {
  /** Tasks of `dateKey`, any status. */
  tasks: Task[];
  /** Still-pending tasks from before today; shown only while `dateKey` is today. */
  backlog: Task[];
  dateKey: string;
  dossiers: Dossier[];
  focused: boolean;
  /** Flash the pending rows of one dossier (from a dossier card or the Cerveau panel). `seq` changes on each request. */
  flash?: { dossierId: string; seq: number } | null;
  actions: JournalActions;
}) {
  const { t, locale } = useI18n();
  const [manualEntryOpen, setManualEntryOpen] = useState(false);
  const [editing, setEditing] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState<Task | null>(null);
  const [leaving, setLeaving] = useState<Set<string>>(new Set());
  const [validatedOpen, setValidatedOpen] = useState(false);

  const todayKey = todayKeyParis();
  const isToday = dateKey === todayKey;
  const pending = tasks.filter((x) => x.status === "pending");
  // Never the same task twice, even if the two lists were fetched a moment apart.
  const carried = isToday ? backlog.filter((b) => !pending.some((x) => x.id === b.id)) : [];
  const shown = [...pending, ...carried];
  const validated = tasks.filter((x) => x.status === "validated");
  const pendingMin = shown.reduce((s, x) => s + x.durationMin, 0);
  const dateLocale = locale === "en" ? "en-GB" : "fr-FR";
  const heading = new Intl.DateTimeFormat(dateLocale, { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "Europe/Paris" }).format(
    dateKeyToDate(dateKey),
  );
  const shortDay = new Intl.DateTimeFormat(dateLocale, { weekday: "short", day: "numeric", month: "short", timeZone: "Europe/Paris" });

  // A row that left the list (validated, deleted) no longer needs its "leaving" mark.
  useEffect(() => {
    setLeaving((current) => {
      const ids = new Set(shown.map((x) => x.id));
      const next = new Set([...current].filter((id) => ids.has(id)));
      return next.size === current.size ? current : next;
    });
  }, [tasks, backlog]); // eslint-disable-line react-hooks/exhaustive-deps

  const markLeaving = (ids: string[]) => setLeaving((current) => new Set([...current, ...ids]));
  const clearLeaving = (ids: string[]) => setLeaving((current) => new Set([...current].filter((id) => !ids.includes(id))));

  // Prototype validateTask: the row slides out while the validation is saved; it comes back if the save failed.
  const validateOne = async (id: string) => {
    markLeaving([id]);
    await actions.onValidate(id);
    clearLeaving([id]);
  };
  const validateShown = async () => {
    const ids = shown.map((x) => x.id);
    markLeaving(ids);
    await actions.onValidateAll(ids);
    clearLeaving(ids);
  };

  const showBatchBar = shown.length >= 2;
  const flashSeq = (task: Task) => (flash && task.dossierId === flash.dossierId ? flash.seq : 0);

  const row = (task: Task, dateLabel?: string) => (
    <TaskRow
      key={task.id}
      task={task}
      dossiers={dossiers}
      dateLabel={dateLabel}
      leaving={leaving.has(task.id)}
      flash={flashSeq(task)}
      showActions={focused}
      onValidate={validateOne}
      onReassign={actions.onReassign}
      onEdit={setEditing}
      onDelete={setDeleting}
    />
  );

  return (
    <section className="glass fade-up flex w-full flex-col">
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-4">
        <div>
          <p className="eyebrow">{t.journal.title}</p>
          <h2 className="mt-1 font-display text-[15px] font-extrabold uppercase tracking-[0.05em] text-ivory">{heading}</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full border border-gold/25 bg-gold/10 px-2.5 py-1 font-mono text-[11px] text-gold-pale">
            {shown.length === 0 ? t.journal.upToDate : t.journal.pendingPill(shown.length)}
          </span>
          {focused && actions.onSetDate && (
            <>
              <button type="button" onClick={() => actions.onSetDate!(shiftDateKey(dateKey, -1))} data-tour="journal-days" title={t.journal.previousDay} aria-label={t.journal.previousDay} className={NAV_BUTTON}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                type="button"
                onClick={() => actions.onSetDate!(shiftDateKey(dateKey, 1))}
                disabled={isToday}
                data-tour="journal-days"
                title={t.journal.nextDay}
                aria-label={t.journal.nextDay}
                className={NAV_BUTTON}
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}
          <button
            type="button"
            onClick={() => setManualEntryOpen(true)}
            data-tour="journal-manual"
            title={t.journal.manualEntry}
            aria-label={t.journal.manualEntry}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/[0.08] text-ash transition hover:border-gold/30 hover:text-gold-pale"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 5v14M5 12h14" />
            </svg>
          </button>
        </div>
      </div>

      <div
        data-tour="journal-list"
        className="scroll-thin relative flex-1 overflow-y-auto"
        style={{ maxHeight: focused ? "64vh" : "clamp(280px, 44vh, 560px)", minHeight: 240 }}
      >
        <div>{pending.map((x) => row(x))}</div>

        {carried.length > 0 && (
          <div>
            <p className="eyebrow border-b border-white/[0.05] bg-white/[0.02] px-5 py-2 !text-amber-300/80">{t.journal.backlogTitle(carried.length)}</p>
            {carried.map((x) => row(x, shortDay.format(new Date(x.startedAt))))}
          </div>
        )}

        {shown.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 px-6 py-16 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-gold/35 bg-gold/10">
              <svg className="text-gold-pale" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 6 9 17l-5-5" />
              </svg>
            </div>
            <p className="font-display text-[16px] font-extrabold uppercase tracking-[0.04em] text-ivory">{t.journal.emptyTitle}</p>
            <p className="max-w-[300px] text-[13px] text-ash">{t.journal.emptyBody}</p>
          </div>
        )}

        {focused && validated.length > 0 && (
          <div>
            <button
              type="button"
              onClick={() => setValidatedOpen((v) => !v)}
              aria-expanded={validatedOpen}
              data-tour="journal-validated"
              className="eyebrow flex w-full items-center justify-between border-y border-white/[0.05] bg-white/[0.02] px-5 py-2 text-left transition hover:text-ivory"
            >
              <span>{t.journal.validatedTitle(validated.length, fmtMin(validated.reduce((s, x) => s + x.durationMin, 0)))}</span>
              <svg
                className="transition-transform"
                style={{ transform: validatedOpen ? "rotate(180deg)" : undefined }}
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="m6 9 6 6 6-6" />
              </svg>
            </button>
            {validatedOpen && validated.map((x) => <ValidatedRow key={x.id} task={x} dossiers={dossiers} onUnvalidate={actions.onUnvalidate} />)}
          </div>
        )}

        {showBatchBar && (
          // Sticky-bottom inside a scrolling list necessarily floats over
          // whatever row is currently at the bottom of the viewport (that's
          // what keeps it always reachable) — `glass-soft`'s ~3% background
          // depends entirely on `backdrop-filter: blur()` to hide that row's
          // text, and that blur doesn't reliably render everywhere. An
          // actually-opaque background (matching the dropdown menus) fixes
          // it regardless of backdrop-filter support.
          <div data-tour="journal-batch" className="sticky bottom-3 mx-3 mt-2 mb-3 flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-gold/25 bg-carbon/95 px-4 py-2.5 shadow-[0_8px_30px_-8px_rgba(0,0,0,0.6)] backdrop-blur-xl sm:mx-4">
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-gold pulse-gold" />
              <span className="text-[13px] text-ivory/90">{t.journal.batchLabel(shown.length, fmtMin(pendingMin))}</span>
            </div>
            <button
              onClick={validateShown}
              className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-1.5 text-[13px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
            >
              {t.journal.validateAll}
            </button>
          </div>
        )}
      </div>

      {manualEntryOpen && (
        <ManualEntryModal dossiers={dossiers} defaultDate={dateKey} onClose={() => setManualEntryOpen(false)} onSubmit={actions.onCreateManualTask} />
      )}
      {editing && (
        <ManualEntryModal
          dossiers={dossiers}
          task={editing}
          onClose={() => setEditing(null)}
          onSubmit={(input) =>
            actions.onUpdateTask(editing.id, {
              title: input.title,
              startedAt: input.startedAt,
              durationMin: input.durationMin,
              // Only a real change of dossier is sent: it is logged as a correction.
              ...(input.dossierId && input.dossierId !== editing.dossierId ? { dossierId: input.dossierId } : {}),
            })
          }
        />
      )}
      {deleting && (
        <Modal onClose={() => setDeleting(null)}>
          <p className="eyebrow">{t.nav.journal}</p>
          <h3 className="mt-1 font-display text-[19px] font-bold text-ivory">{t.journal.deleteConfirmTitle}</h3>
          <p className="mt-2 text-[12px] leading-relaxed text-ash">
            {t.journal.deleteConfirmBody(deleting.title, fmtMin(deleting.durationMin), shortDay.format(new Date(deleting.startedAt)))}
          </p>
          <ModalActions>
            <ModalCancelButton onClick={() => setDeleting(null)} />
            <button
              type="button"
              onClick={() => {
                const id = deleting.id;
                setDeleting(null);
                void actions.onDeleteTask(id);
              }}
              className="rounded-full border border-red-500/40 bg-red-500/10 px-4 py-1.5 text-[12.5px] font-semibold text-red-400 transition hover:bg-red-500/20"
            >
              {t.journal.deleteTask}
            </button>
          </ModalActions>
        </Modal>
      )}
    </section>
  );
}
