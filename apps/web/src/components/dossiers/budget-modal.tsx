"use client";

import { useState } from "react";
import type { DossierUsage } from "@acte/contracts";
import { Modal, ModalActions, ModalCancelButton, ModalPrimaryButton } from "@/components/modal";
import { fmtMin } from "@/lib/format";

export function BudgetModal({
  dossier,
  onClose,
  onSave,
}: {
  dossier: DossierUsage;
  onClose: () => void;
  onSave: (budgetMinutes: number) => Promise<void>;
}) {
  const [hours, setHours] = useState(Math.round((dossier.budgetMinutes ?? 600) / 60));
  const [saving, setSaving] = useState(false);

  const save = async () => {
    setSaving(true);
    try {
      await onSave(Math.max(1, hours) * 60);
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">Budget d&rsquo;heures</p>
      <h3 className="mt-1 truncate font-display text-[20px] font-semibold text-ivory">{dossier.name}</h3>
      <label className="mt-4 block text-[11.5px] text-ash" htmlFor="bud-h">
        Forfait d&rsquo;heures du dossier
      </label>
      <div className="mt-1.5 flex items-center gap-3">
        <input
          id="bud-h"
          type="number"
          min={1}
          step={1}
          value={hours}
          onChange={(e) => setHours(parseInt(e.target.value, 10) || 1)}
          className="w-28 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 font-mono text-[15px] text-ivory outline-none transition focus:border-gold/40"
        />
        <span className="text-[13px] text-ash">heures</span>
      </div>
      <p className="mt-3 text-[11px] leading-relaxed text-ash">
        Utilisation actuelle : <span className="font-mono text-gold-pale">{fmtMin(dossier.usedMinutes)}</span> — l&rsquo;IA vous alertera à l&rsquo;approche de la limite.
      </p>
      <ModalActions>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton onClick={save} disabled={saving}>
          Enregistrer
        </ModalPrimaryButton>
      </ModalActions>
    </Modal>
  );
}
