"use client";

import { useState } from "react";
import type { Dossier, Task } from "@acte/contracts";
import { parisDateKey } from "@acte/contracts";
import { Modal, ModalActions, ModalCancelButton, ModalPrimaryButton } from "@/components/modal";
import { ApiError } from "@/lib/api-client";
import { useI18n } from "@/i18n/locale-context";
import { isoToParisTime, parisTimeToIso, todayKeyParis } from "@/lib/time";

export interface TaskInput {
  title: string;
  dossierId: string | null;
  startedAt: string;
  durationMin: number;
}

/**
 * Manual entry, and — with `task` — editing a still-pending entry (D-018).
 * The date field is why a late or forgotten entry can be logged on its real
 * day instead of only "today".
 */
export function ManualEntryModal({
  dossiers,
  task,
  defaultDate,
  onClose,
  onSubmit,
}: {
  dossiers: Dossier[];
  task?: Task;
  defaultDate?: string;
  onClose: () => void;
  onSubmit: (input: TaskInput) => Promise<void>;
}) {
  const { t } = useI18n();
  const today = todayKeyParis();
  const [title, setTitle] = useState(task?.title ?? "");
  const [dossierId, setDossierId] = useState<string>(task?.dossierId ?? "");
  const [date, setDate] = useState(task ? parisDateKey(new Date(task.startedAt)) : (defaultDate ?? today));
  const [startTime, setStartTime] = useState(task ? isoToParisTime(task.startedAt) : "09:00");
  const [durationMin, setDurationMin] = useState(task?.durationMin ?? 30);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const valid = title.trim().length > 0 && /^\d{4}-\d{2}-\d{2}$/.test(date) && date <= today && /^\d{1,2}:\d{2}$/.test(startTime);

  const submit = async () => {
    if (!valid) return;
    setSaving(true);
    setError(null);
    try {
      await onSubmit({
        title: title.trim(),
        dossierId: dossierId || null,
        startedAt: parisTimeToIso(startTime, date),
        durationMin,
      });
      onClose();
    } catch (err) {
      const code = err instanceof ApiError ? err.code : "unknown";
      const messages = t.journal.errors as Record<string, string>;
      setError(messages[code] ?? messages.generic!);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory placeholder-ash/50 outline-none transition focus:border-gold/40";

  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">{t.nav.journal}</p>
      <h3 className="mt-1 font-display text-[20px] font-semibold text-ivory">{task ? t.journal.editEntry : t.journal.manualEntry}</h3>

      <label className="mt-4 block text-[11.5px] text-ash" htmlFor="me-title">
        {t.journal.manualEntryTitle}
      </label>
      <input
        id="me-title"
        type="text"
        value={title}
        maxLength={200}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t.journal.manualEntryTitlePlaceholder}
        className={inputClass}
      />

      <label className="mt-3.5 block text-[11.5px] text-ash" htmlFor="me-dossier">
        {t.journal.manualEntryDossier}
      </label>
      <select
        id="me-dossier"
        value={dossierId}
        onChange={(e) => setDossierId(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-carbon px-3.5 py-2.5 text-[13px] text-ivory outline-none transition focus:border-gold/40"
      >
        {/* A task that already has a dossier can be moved, not unassigned (a move logs a correction). */}
        {!task?.dossierId && <option value="">{t.journal.unassigned}</option>}
        {dossiers
          .filter((d) => d.status !== "archived" || d.id === task?.dossierId)
          .map((d) => (
            <option key={d.id} value={d.id}>
              {d.name}
            </option>
          ))}
      </select>

      <label className="mt-3.5 block text-[11.5px] text-ash" htmlFor="me-date">
        {t.journal.manualEntryDate}
      </label>
      <input id="me-date" type="date" value={date} max={today} onChange={(e) => setDate(e.target.value)} className={`${inputClass} font-mono`} />

      <div className="mt-3.5 flex gap-3">
        <div className="flex-1">
          <label className="block text-[11.5px] text-ash" htmlFor="me-start">
            {t.journal.manualEntryStart}
          </label>
          <input id="me-start" type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className={`${inputClass} font-mono`} />
        </div>
        <div className="flex-1">
          <label className="block text-[11.5px] text-ash" htmlFor="me-duration">
            {t.journal.manualEntryDuration}
          </label>
          <input
            id="me-duration"
            type="number"
            min={1}
            max={1440}
            step={5}
            value={durationMin}
            onChange={(e) => setDurationMin(Math.min(1440, Math.max(1, parseInt(e.target.value, 10) || 1)))}
            className={`${inputClass} font-mono`}
          />
        </div>
      </div>

      {error && <p className="mt-3 text-[12px] text-red-400">{error}</p>}

      <ModalActions>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton onClick={submit} disabled={saving || !valid}>
          {task ? t.journal.editEntrySubmit : t.journal.manualEntrySubmit}
        </ModalPrimaryButton>
      </ModalActions>
    </Modal>
  );
}
