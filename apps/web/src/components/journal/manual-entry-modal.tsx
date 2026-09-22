"use client";

import { useState } from "react";
import type { Dossier } from "@acte/contracts";
import { Modal, ModalActions, ModalCancelButton, ModalPrimaryButton } from "@/components/modal";
import { fr } from "@/i18n/fr";
import { parisTimeToIso } from "@/lib/time";

export function ManualEntryModal({
  dossiers,
  onClose,
  onSubmit,
}: {
  dossiers: Dossier[];
  onClose: () => void;
  onSubmit: (input: { title: string; dossierId: string | null; startedAt: string; durationMin: number }) => Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [dossierId, setDossierId] = useState<string>("");
  const [startTime, setStartTime] = useState("09:00");
  const [durationMin, setDurationMin] = useState(30);
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    try {
      await onSubmit({
        title: title.trim(),
        dossierId: dossierId || null,
        startedAt: parisTimeToIso(startTime),
        durationMin,
      });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">Journal</p>
      <h3 className="mt-1 font-display text-[20px] font-semibold text-ivory">{fr.journal.manualEntry}</h3>

      <label className="mt-4 block text-[11.5px] text-ash" htmlFor="me-title">
        {fr.journal.manualEntryTitle}
      </label>
      <input
        id="me-title"
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Rédaction de conclusions — Dupont c/ Durand"
        className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory placeholder-ash/50 outline-none transition focus:border-gold/40"
      />

      <label className="mt-3.5 block text-[11.5px] text-ash" htmlFor="me-dossier">
        {fr.journal.manualEntryDossier}
      </label>
      <select
        id="me-dossier"
        value={dossierId}
        onChange={(e) => setDossierId(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-carbon px-3.5 py-2.5 text-[13px] text-ivory outline-none transition focus:border-gold/40"
      >
        <option value="">Non assigné</option>
        {dossiers.map((d) => (
          <option key={d.id} value={d.id}>
            {d.name}
          </option>
        ))}
      </select>

      <div className="mt-3.5 flex gap-3">
        <div className="flex-1">
          <label className="block text-[11.5px] text-ash" htmlFor="me-start">
            {fr.journal.manualEntryStart}
          </label>
          <input
            id="me-start"
            type="time"
            value={startTime}
            onChange={(e) => setStartTime(e.target.value)}
            className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 font-mono text-[13px] text-ivory outline-none transition focus:border-gold/40"
          />
        </div>
        <div className="flex-1">
          <label className="block text-[11.5px] text-ash" htmlFor="me-duration">
            {fr.journal.manualEntryDuration}
          </label>
          <input
            id="me-duration"
            type="number"
            min={1}
            step={5}
            value={durationMin}
            onChange={(e) => setDurationMin(Math.max(1, parseInt(e.target.value, 10) || 1))}
            className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 font-mono text-[13px] text-ivory outline-none transition focus:border-gold/40"
          />
        </div>
      </div>

      <ModalActions>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton onClick={submit} disabled={saving || !title.trim()}>
          {fr.journal.manualEntrySubmit}
        </ModalPrimaryButton>
      </ModalActions>
    </Modal>
  );
}
