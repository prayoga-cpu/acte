"use client";

import { useEffect } from "react";

export function Modal({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div id="modal-root" className="fixed inset-0 z-[80] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="fade-up relative w-full max-w-[400px] rounded-2xl border border-white/[0.1] bg-carbon p-5 shadow-[0_24px_70px_-18px_rgba(0,0,0,0.9)]">
        <button
          type="button"
          onClick={onClose}
          aria-label="Fermer"
          className="absolute right-3.5 top-3.5 flex h-7 w-7 items-center justify-center rounded-lg text-ash transition hover:bg-white/[0.06] hover:text-ivory"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M18 6 6 18" />
            <path d="m6 6 12 12" />
          </svg>
        </button>
        {children}
      </div>
    </div>
  );
}

export function ModalActions({ children }: { children: React.ReactNode }) {
  return <div className="mt-5 flex justify-end gap-2">{children}</div>;
}

export function ModalCancelButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-full border border-white/[0.12] px-4 py-1.5 text-[12.5px] text-ivory/80 transition hover:border-white/25"
    >
      Annuler
    </button>
  );
}

export function ModalPrimaryButton({
  onClick,
  children,
  disabled,
}: {
  onClick: () => void;
  children: React.ReactNode;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-1.5 text-[12.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98] disabled:opacity-60"
    >
      {children}
    </button>
  );
}
