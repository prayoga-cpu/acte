"use client";

import type { TaskSource } from "@acte/contracts";
import { useI18n, type Dictionary } from "@/i18n/locale-context";

function sourceCopy(t: Dictionary): Record<Exclude<TaskSource, "manual">, { label: string; style: React.CSSProperties }> {
  return {
    outlook: {
      label: t.journal.capturedViaOutlook,
      style: { background: "rgba(56,132,222,0.12)", border: "1px solid rgba(92,164,240,0.38)", color: "#5ca4f0" },
    },
    word: {
      label: t.journal.capturedViaWord,
      style: { background: "rgba(43,87,154,0.16)", border: "1px solid rgba(110,146,220,0.38)", color: "#8aa8ea" },
    },
    web: {
      label: t.journal.capturedViaWeb,
      style: { background: "rgba(148,190,210,0.08)", border: "1px solid rgba(148,190,210,0.3)", color: "#9fc2d4" },
    },
  };
}

const SIZE_CLASS = { 6: "h-6 w-6", 8: "h-8 w-8" } as const;

export function SourceBadge({ source, size = 8 }: { source: TaskSource; size?: 6 | 8 }) {
  const { t } = useI18n();
  if (source === "manual") {
    return (
      <span
        className={`flex ${SIZE_CLASS[size]} shrink-0 items-center justify-center rounded-lg border border-white/[0.1] bg-white/[0.04] text-ash`}
        title={t.journal.manualEntry}
        aria-label={t.journal.manualEntry}
      >
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <path d="M17 3a2.8 2.8 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z" />
        </svg>
      </span>
    );
  }
  const s = sourceCopy(t)[source];
  return (
    <span
      className={`flex ${SIZE_CLASS[size]} shrink-0 items-center justify-center rounded-lg`}
      style={s.style}
      title={s.label}
      aria-label={s.label}
    >
      {source === "web" ? (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="10" />
          <path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20" />
          <path d="M2 12h20" />
        </svg>
      ) : (
        <span className="font-body text-[13px] font-semibold leading-none">{source === "outlook" ? "O" : "W"}</span>
      )}
    </span>
  );
}
