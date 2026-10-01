"use client";

import { useState } from "react";
import { Modal, ModalActions, ModalCancelButton, ModalPrimaryButton } from "@/components/modal";
import { useI18n } from "@/i18n/locale-context";

export function RenameFirmModal({ firmName, onClose, onSave }: { firmName: string; onClose: () => void; onSave: (name: string) => Promise<void> }) {
  const { t } = useI18n();
  const [name, setName] = useState(firmName);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await onSave(name.trim());
      onClose();
    } catch {
      setError(t.admin.errors.generic);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">{t.admin.title}</p>
      <h3 className="mt-1 font-display text-[20px] font-semibold text-ivory">{t.admin.renameFirm}</h3>
      <label className="mt-4 block text-[11.5px] text-ash" htmlFor="firm-name">
        {t.admin.firmNameLabel}
      </label>
      <input
        id="firm-name"
        type="text"
        value={name}
        maxLength={120}
        onChange={(e) => setName(e.target.value)}
        className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory outline-none transition focus:border-gold/40"
      />
      <p className="mt-3 text-[11px] leading-relaxed text-ash">{t.admin.firmNameHint}</p>
      {error && <p className="mt-2 text-[11.5px] text-red-400">{error}</p>}
      <ModalActions>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton onClick={save} disabled={saving || !name.trim()}>
          {t.common.save}
        </ModalPrimaryButton>
      </ModalActions>
    </Modal>
  );
}
