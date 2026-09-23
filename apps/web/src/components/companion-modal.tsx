"use client";

import { useState } from "react";
import { Modal, ModalActions, ModalCancelButton, ModalPrimaryButton } from "@/components/modal";
import { useI18n } from "@/i18n/locale-context";

type Os = "win" | "mac";

const WINDOWS_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect width="20" height="14" x="2" y="3" rx="2" />
    <line x1="8" x2="16" y1="21" y2="21" />
    <line x1="12" x2="12" y1="17" y2="21" />
  </svg>
);
const MAC_ICON = (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 16V7a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v9m16 0H4m16 0 1.28 2.55a1 1 0 0 1-.9 1.45H3.62a1 1 0 0 1-.9-1.45L4 16" />
  </svg>
);
const CHECK_ICON = (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20 6 9 17l-5-5" />
  </svg>
);

function detectOs(): Os {
  if (typeof navigator === "undefined") return "win";
  return /mac/i.test(`${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`) ? "mac" : "win";
}

/**
 * Simulated, exactly like the prototype's `openCompanionModal` /
 * `startCompanionDownload` — there is no real installer. The actual
 * Companion is `apps/tracker`, gated behind a scope amendment and D-001–
 * D-003 (see apps/tracker/README.md); this UI is a demo affordance only,
 * built at Darwin's explicit request overriding that exclusion for now
 * (see DECISIONS.md D-011).
 */
export function CompanionModal({ onClose, onDownloadStart }: { onClose: () => void; onDownloadStart: (file: string) => void }) {
  const { t } = useI18n();
  const [choice, setChoice] = useState<Os>(detectOs());

  const file = choice === "mac" ? "ACTE_Tracker.dmg" : "ACTE_Tracker.exe";
  const isMacDetected = detectOs() === "mac";

  const osRow = (os: Os, label: string, fileName: string, size: string, icon: React.ReactNode) => (
    <button
      key={os}
      type="button"
      onClick={() => setChoice(os)}
      className={`flex w-full items-center gap-3 rounded-xl border px-3.5 py-3 text-left transition ${
        choice === os ? "border-gold/45 bg-gold/10" : "border-white/[0.09] bg-white/[0.03] hover:border-gold/25"
      }`}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.03] text-ash">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[13px] font-medium text-ivory/95">{label}</span>
        <span className="block font-mono text-[11px] text-ash">
          {fileName} · {size}
        </span>
      </span>
      <span className={`text-gold-pale ${choice === os ? "" : "invisible"}`}>{CHECK_ICON}</span>
    </button>
  );

  return (
    <Modal onClose={onClose}>
      <p className="eyebrow">{t.companion.eyebrow}</p>
      <h3 className="mt-1 font-display text-[20px] font-semibold text-ivory">{t.companion.title}</h3>
      <p className="mt-1.5 text-[11.5px] leading-relaxed text-ash">
        {t.companion.bodyPre}
        <b className="text-ivory/80">{t.companion.bodyEmphasis}</b>
        {t.companion.bodyPost}
      </p>
      <div className="mt-4 space-y-2">
        {osRow("win", t.companion.windows, "ACTE_Tracker.exe", "38 Mo", WINDOWS_ICON)}
        {osRow("mac", t.companion.mac, "ACTE_Tracker.dmg", "42 Mo", MAC_ICON)}
      </div>
      <p className="mt-3 text-[11px] text-ash">{t.companion.versionNote(isMacDetected ? "macOS" : "Windows")}</p>
      <ModalActions>
        <ModalCancelButton onClick={onClose} />
        <ModalPrimaryButton
          onClick={() => {
            onClose();
            onDownloadStart(file);
          }}
        >
          <span className="flex items-center gap-2">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" x2="12" y1="3" y2="15" />
            </svg>
            {t.companion.download}
          </span>
        </ModalPrimaryButton>
      </ModalActions>
    </Modal>
  );
}
