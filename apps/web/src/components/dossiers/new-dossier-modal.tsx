"use client";

import { useState } from "react";
import { Modal, ModalActions, ModalCancelButton, ModalPrimaryButton } from "@/components/modal";

export function NewDossierModal({
  onClose,
  onCreate,
}: {
  onClose: () => void;
  onCreate: (input: { name: string; clientLabel: string; budgetMinutes: number | null }) => Promise<void>;
}) {
  const [name, setName] = useState("");
  const [client, setClient] = useState("");
  const [hours, setHours] = useState(10);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!name.trim()) {
      setError("Le nom du dossier est requis");
      return;
    }
    setSaving(true);
    try {
      await onCreate({ name: name.trim(), clientLabel: client.trim() || "Client à préciser", budgetMinutes: Math.max(1, hours) * 60 });
      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">Dossiers</p>
      <h3 className="mt-1 font-display text-[20px] font-semibold text-ivory">Nouveau dossier</h3>

      <label className="mt-4 block text-[11.5px] text-ash" htmlFor="nd-name">
        Nom du dossier
      </label>
      <input
        id="nd-name"
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Dupont c/ Assurances du Littoral"
        className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory placeholder-ash/50 outline-none transition focus:border-gold/40"
      />

      <label className="mt-3.5 block text-[11.5px] text-ash" htmlFor="nd-client">
        Client
      </label>
      <input
        id="nd-client"
        type="text"
        value={client}
        onChange={(e) => setClient(e.target.value)}
        placeholder="M. A. Dupont"
        className="mt-1.5 w-full rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5 text-[13px] text-ivory placeholder-ash/50 outline-none transition focus:border-gold/40"
      />

      <label className="mt-3.5 block text-[11.5px] text-ash" htmlFor="nd-budget">
        Budget d&rsquo;heures
      </label>
      <div className="mt-1.5 flex items-center gap-3">
        <input
          id="nd-budget"
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
        Le dossier sera immédiatement proposé par l&rsquo;IA dans le Journal du temps pour l&rsquo;association des captures.
      </p>
      {error && <p className="mt-2 text-[11.5px] text-red-400">{error}</p>}

      <ModalActions>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton onClick={submit} disabled={saving}>
          Créer le dossier
        </ModalPrimaryButton>
      </ModalActions>
    </Modal>
  );
}
