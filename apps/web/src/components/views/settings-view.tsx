"use client";

import { useState } from "react";
import type { Member, TaskSource } from "@acte/contracts";
import { fmtEurFromCents } from "@/lib/format";
import { SourceBadge } from "@/components/journal/source-badge";

const SOURCES: { src: Exclude<TaskSource, "manual">; name: string; desc: string }[] = [
  { src: "word", name: "Word", desc: "Documents, conclusions, protocoles" },
  { src: "outlook", name: "Outlook", desc: "Courriels entrants et sortants" },
  { src: "web", name: "Navigateur", desc: "Sites juridiques allowlistés (D-006)" },
];

/**
 * Sources are shown as a preview of Settings' eventual shape, but none of
 * them do anything yet — there is no Companion to turn on or off (stage 4,
 * apps/tracker is gated). Toggling here is local-only UI state.
 */
export function SettingsView({ member }: { member: Member }) {
  const [sourcesOn, setSourcesOn] = useState<Record<string, boolean>>({ word: true, outlook: true, web: true });

  return (
    <div className="mx-auto max-w-[920px]">
      <div className="mb-4">
        <p className="eyebrow">Paramètres</p>
        <h2 className="mt-1 font-display text-[16px] font-extrabold uppercase tracking-[0.05em] text-ivory">Réglages de la capture</h2>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <section className="glass fade-up p-5">
          <p className="eyebrow">Sources surveillées</p>
          <p className="mt-1.5 text-[11px] text-ash">Aperçu — actif seulement une fois le Compagnon installé (stage 4).</p>
          <div className="mt-2 divide-y divide-white/[0.05]">
            {SOURCES.map((r) => (
              <div key={r.src} className="flex items-center gap-3 py-2.5">
                <SourceBadge source={r.src} size={6} />
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] text-ivory/90">{r.name}</p>
                  <p className="text-[11px] text-ash">{r.desc}</p>
                </div>
                <label className="switch">
                  <input
                    type="checkbox"
                    checked={sourcesOn[r.src]}
                    onChange={(e) => setSourcesOn((s) => ({ ...s, [r.src]: e.target.checked }))}
                  />
                  <span className="slider" />
                </label>
              </div>
            ))}
          </div>
        </section>

        <section className="glass fade-up p-5">
          <p className="eyebrow">Mon taux horaire</p>
          <p className="mt-2 font-mono text-[22px] text-ivory">{fmtEurFromCents(member.hourlyRateCents)} / h</p>
          <p className="mt-3 text-[11.5px] leading-relaxed text-ash">
            Défini par le cabinet. La modification par l&rsquo;administrateur du cabinet arrive avec la Console Admin (D-004, en attente de décision).
          </p>
        </section>

        <section className="glass fade-up p-5 md:col-span-2">
          <p className="eyebrow">Confidentialité</p>
          <p className="mt-2 text-[13px] leading-relaxed text-ivory/85">
            Les contenus (documents, courriels, pages web) ne quittent jamais votre poste. Seules des métadonnées de temps — durée, dossier, source —
            remontent, chiffrées avec la clé de votre cabinet. Voir docs/03-security/PRIVACY_MODEL.md.
          </p>
        </section>
      </div>
    </div>
  );
}
