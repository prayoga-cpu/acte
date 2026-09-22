"use client";

import { useEffect, useState } from "react";
import type { Device } from "@acte/contracts";
import { api } from "@/lib/api-client";

export function CloudView({ complianceClaimsEnabled }: { complianceClaimsEnabled: boolean }) {
  const [devices, setDevices] = useState<Device[] | null>(null);

  useEffect(() => {
    api.get<Device[]>("/v1/devices").then(setDevices);
  }, []);

  return (
    <div className="mx-auto max-w-[1080px]">
      <div className="mb-4">
        <p className="eyebrow">Cloud ACTE</p>
        <h2 className="mt-0.5 font-display text-[22px] font-bold text-ivory">Synchronisation &amp; sauvegarde</h2>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <section className="glass fade-up md:col-span-2 md:row-span-2">
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.06] px-5 py-3.5">
            <p className="eyebrow !mb-0">Appareils liés</p>
          </div>
          {devices === null ? (
            <p className="px-5 py-6 text-[13px] text-ash">Chargement…</p>
          ) : devices.length === 0 ? (
            <p className="px-5 py-6 text-[13px] text-ash">
              Aucun appareil lié pour l&rsquo;instant — le Compagnon de capture (Word, Outlook, navigateur) arrive au stage 4 du projet.
            </p>
          ) : (
            devices.map((dv, i) => (
              <div key={dv.id} className={`flex flex-wrap items-center gap-x-4 gap-y-2 px-5 py-3.5 ${i > 0 ? "border-t border-white/[0.05]" : ""}`}>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.03] text-ash">
                  {dv.os === "macos" ? (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
                    </svg>
                  ) : (
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <rect width="20" height="14" x="2" y="3" rx="2" />
                      <line x1="8" x2="16" y1="21" y2="21" />
                      <line x1="12" x2="12" y1="17" y2="21" />
                    </svg>
                  )}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[13.5px] font-medium text-ivory/95">{dv.name}</p>
                  <p className="mt-0.5 truncate text-[11.5px] text-ash">
                    {dv.os === "macos" ? "macOS" : "Windows"} · Compagnon v{dv.companionVersion}
                  </p>
                </div>
                <span className={`flex w-44 shrink-0 items-center justify-end gap-1.5 text-[11.5px] ${dv.status === "online" ? "text-emerald-300" : "text-ash"}`}>
                  <span className={`h-1.5 w-1.5 rounded-full ${dv.status === "online" ? "bg-emerald-400 pulse-dot" : "bg-white/25"}`} />
                  {dv.status === "online" ? "Synchronisé" : "Hors ligne"}
                </span>
              </div>
            ))
          )}
        </section>

        <section className="glass fade-up flex flex-wrap items-start gap-3.5 p-5 md:col-span-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-emerald-400/25 bg-emerald-400/[0.08] text-emerald-300">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </span>
          <div className="min-w-[240px] flex-1">
            <p className="text-[13px] font-medium text-ivory/95">Secret professionnel préservé</p>
            <p className="mt-1 text-[12px] leading-relaxed text-ash">
              Le Cloud ACTE ne transporte que des métadonnées chiffrées de bout en bout (AES-256) : durées, dossiers, sources. Hébergement en Union
              européenne (Paris). Vous restez propriétaire de vos données.
              {complianceClaimsEnabled && (
                <>
                  {" "}
                  Certification <b className="text-ivory/90">ISO 27001</b> en préparation.
                </>
              )}
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
