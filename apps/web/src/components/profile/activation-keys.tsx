"use client";

import { useEffect, useState } from "react";
import type { ActivationKeyCreated, ActivationKeySummary } from "@acte/contracts";
import { api } from "@/lib/api-client";

export function ActivationKeys() {
  const [keys, setKeys] = useState<ActivationKeySummary[]>([]);
  const [justCreated, setJustCreated] = useState<ActivationKeyCreated | null>(null);
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ActivationKeySummary[]>("/v1/me/keys")
      .then(setKeys)
      .finally(() => setLoading(false));
  }, []);

  const create = async () => {
    const created = await api.post<ActivationKeyCreated>("/v1/me/keys");
    setJustCreated(created);
    setKeys(await api.get<ActivationKeySummary[]>("/v1/me/keys"));
  };

  const revoke = async (id: string) => {
    await api.delete(`/v1/me/keys/${id}`);
    setKeys(await api.get<ActivationKeySummary[]>("/v1/me/keys"));
    if (justCreated?.id === id) setJustCreated(null);
  };

  const copy = async () => {
    if (!justCreated) return;
    try {
      await navigator.clipboard.writeText(justCreated.plainKey);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      // clipboard unavailable — the key is already shown on screen to copy manually.
    }
  };

  const active = keys.filter((k) => !k.revokedAt);

  return (
    <section className="glass fade-up p-5 md:col-span-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="eyebrow">Liaison de l&rsquo;application locale</p>
        <span className="flex items-center gap-1.5 text-[11px] text-ash">
          <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
          Compagnon non détecté sur ce poste
        </span>
      </div>

      {justCreated ? (
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <div className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl border border-white/[0.09] bg-white/[0.04] px-3.5 py-2.5">
            <span className="shrink-0 text-[11.5px] text-ash">Nouvelle clé :</span>
            <code className="min-w-0 truncate font-mono text-[12.5px] tracking-wide text-ivory">{justCreated.plainKey}</code>
          </div>
          <button
            onClick={copy}
            className="w-[86px] rounded-full border border-gold/35 bg-gold/10 px-3.5 py-2 text-[12px] font-semibold text-gold-pale transition hover:bg-gold/[0.18]"
          >
            {copied ? "Copié !" : "Copier"}
          </button>
        </div>
      ) : (
        <p className="mt-3.5 text-[11.5px] leading-relaxed text-ash">
          Cette clé se copie une seule fois, à la création. Générez-en une pour lier le Compagnon ACTE à ce poste dès qu&rsquo;il sera disponible (stage 4).
        </p>
      )}

      {!loading && active.length > 0 && (
        <ul className="mt-3.5 space-y-1.5">
          {active.map((k) => (
            <li key={k.id} className="flex items-center justify-between gap-2 text-[12px]">
              <code className="font-mono text-ivory/80">{k.prefix}…</code>
              <button onClick={() => revoke(k.id)} className="text-red-400 transition hover:text-red-300">
                Révoquer
              </button>
            </li>
          ))}
        </ul>
      )}

      <button
        type="button"
        onClick={create}
        className="mt-3.5 rounded-full border border-white/[0.12] px-3.5 py-2 text-[12px] text-ivory/85 transition hover:border-gold/35 hover:text-gold-pale"
      >
        + Générer une clé d&rsquo;activation
      </button>
    </section>
  );
}
