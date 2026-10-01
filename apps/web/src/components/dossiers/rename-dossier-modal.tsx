"use client";

import { useState } from "react";
import type { DossierUsage } from "@acte/contracts";
import { Modal, ModalActions, ModalCancelButton, ModalPrimaryButton } from "@/components/modal";
import { useI18n } from "@/i18n/locale-context";

/** Not in the prototype (D-018): a typo in a dossier or client name could not be fixed. */
export function RenameDossierModal({
  dossier,
  onClose,
  onSave,
}: {
  dossier: DossierUsage;
  onClose: () => void;
  onSave: (input: { name: string; clientLabel: string }) => Promise<void>;
}) {
  const { t } = useI18n();
  const [name, setName] = useState(dossier.name);
  const [client, setClient] = useState(dossier.clientLabel);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const save = async () => {
    if (!name.trim()) {
      setError(t.dossiers.nameRequired);
      return;
    }
    setSaving(true);
    setError(null);
    try {
      await onSave({ name: name.trim(), clientLabel: client.trim() });
      onClose();
    } catch {
      setError(t.dossiers.renameError);
    } finally {
      setSaving(false);
    }
  };

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory placeholder-ash/50 outline-none transition focus:border-gold/40";

  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">{t.nav.dossiers}</p>
      <h3 className="mt-1 font-display text-[20px] font-semibold text-ivory">{t.dossiers.renameDossier}</h3>
      <label className="mt-4 block text-[11.5px] text-ash" htmlFor="rn-name">
        {t.dossiers.newDossierName}
      </label>
      <input id="rn-name" type="text" value={name} maxLength={160} onChange={(e) => setName(e.target.value)} className={inputClass} />
      <label className="mt-3.5 block text-[11.5px] text-ash" htmlFor="rn-client">
        {t.dossiers.newDossierClient}
      </label>
      <input id="rn-client" type="text" value={client} maxLength={160} onChange={(e) => setClient(e.target.value)} className={inputClass} />
      {error && <p className="mt-2 text-[11.5px] text-red-400">{error}</p>}
      <ModalActions>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton onClick={save} disabled={saving}>
          {t.common.save}
        </ModalPrimaryButton>
      </ModalActions>
    </Modal>
  );
}
