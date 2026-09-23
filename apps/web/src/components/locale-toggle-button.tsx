"use client";

import { useI18n } from "@/i18n/locale-context";

export function LocaleToggleButton({ className = "" }: { className?: string }) {
  const { t, locale, setLocale } = useI18n();

  return (
    <button
      type="button"
      onClick={() => setLocale(locale === "fr" ? "en" : "fr")}
      aria-label={t.common.languageToggle}
      title={t.common.languageToggle}
      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.03] font-mono text-[11px] font-semibold text-ash transition hover:border-gold/30 hover:text-gold-pale ${className}`}
    >
      {locale.toUpperCase()}
    </button>
  );
}
