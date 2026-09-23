"use client";

import { useRef, useState } from "react";
import type { DossierStatus, DossierUsage } from "@acte/contracts";
import { useOutsideClick } from "@/lib/use-outside-click";
import { useI18n, type Dictionary } from "@/i18n/locale-context";

function statusLabel(t: Dictionary): Record<DossierStatus, string> {
  return { progress: t.dossiers.statusProgress, ready: t.dossiers.statusReady, archived: t.dossiers.statusArchived };
}
const CHECK = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

export function DossierMenu({
  dossier,
  onEditBudget,
  onSetStatus,
}: {
  dossier: DossierUsage;
  onEditBudget: () => void;
  onSetStatus: (status: DossierStatus) => void;
}) {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [statusListOpen, setStatusListOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useOutsideClick(
    ref,
    () => {
      setOpen(false);
      setStatusListOpen(false);
    },
    open,
  );
  const archived = dossier.status === "archived";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label={t.dossiers.dossierActionsAria(dossier.name)}
        aria-haspopup="menu"
        className="flex h-7 w-7 items-center justify-center rounded-lg border border-white/[0.08] text-ash transition hover:border-gold/35 hover:text-gold-pale"
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
          <circle cx="5" cy="12" r="1.8" />
          <circle cx="12" cy="12" r="1.8" />
          <circle cx="19" cy="12" r="1.8" />
        </svg>
      </button>
      {open && (
        <div className="dossier-menu fade-up absolute right-0 top-[calc(100%+6px)] z-[70] w-[240px] overflow-hidden rounded-xl border border-white/[0.1] bg-carbon/95 shadow-[0_14px_40px_-8px_rgba(0,0,0,0.8)] backdrop-blur-xl">
          <p className="truncate border-b border-white/[0.06] px-3.5 py-2 text-[10px] uppercase tracking-[0.16em] text-ash">{dossier.name}</p>
          <button
            type="button"
            onClick={() => {
              setOpen(false);
              onEditBudget();
            }}
            className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] text-ivory/90 transition hover:bg-white/[0.05]"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
              <line x1="21" x2="14" y1="4" y2="4" />
              <line x1="10" x2="3" y1="4" y2="4" />
              <line x1="21" x2="12" y1="12" y2="12" />
              <line x1="8" x2="3" y1="12" y2="12" />
              <line x1="21" x2="16" y1="20" y2="20" />
              <line x1="12" x2="3" y1="20" y2="20" />
              <line x1="14" x2="14" y1="2" y2="6" />
              <line x1="8" x2="8" y1="10" y2="14" />
              <line x1="16" x2="16" y1="18" y2="22" />
            </svg>
            <span>{t.dossiers.adjustHoursBudget}</span>
          </button>
          <button
            type="button"
            onClick={() => setStatusListOpen((v) => !v)}
            className="flex w-full items-center justify-between gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] text-ivory/90 transition hover:bg-white/[0.05]"
          >
            <span className="flex items-center gap-2.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z" />
                <circle cx="7.5" cy="7.5" r="0.5" fill="currentColor" />
              </svg>
              <span>{t.dossiers.changeStatus}</span>
            </span>
            <svg
              className="transition-transform"
              style={{ transform: statusListOpen ? "rotate(180deg)" : undefined }}
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
          {statusListOpen && (
            <div className="border-y border-white/[0.05] bg-white/[0.02] py-1">
              {(Object.keys(statusLabel(t)) as DossierStatus[]).map((st) => (
                <button
                  key={st}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    setStatusListOpen(false);
                    if (dossier.status !== st) onSetStatus(st);
                  }}
                  className={`flex w-full items-center justify-between px-3.5 py-2 pl-10 text-left text-[12px] transition hover:bg-gold/10 ${
                    dossier.status === st ? "text-gold-pale" : "text-ivory/85"
                  }`}
                >
                  <span>{statusLabel(t)[st]}</span>
                  {dossier.status === st ? CHECK : null}
                </button>
              ))}
            </div>
          )}
          {archived ? (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSetStatus("progress");
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] text-emerald-300 transition hover:bg-emerald-400/10"
            >
              {CHECK}
              <span>{t.dossiers.restoreDossier}</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                onSetStatus("archived");
              }}
              className="flex w-full items-center gap-2.5 px-3.5 py-2.5 text-left text-[12.5px] text-red-400 transition hover:bg-red-500/10"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <rect width="20" height="5" x="2" y="3" rx="1" />
                <path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8" />
                <path d="M10 12h4" />
              </svg>
              <span>{t.dossiers.archiveDossier}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
