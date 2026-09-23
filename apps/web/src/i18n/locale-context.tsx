"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import { en } from "./en";
import { fr } from "./fr";

export type Locale = "fr" | "en";

// fr.ts/en.ts are declared `as const` for literal-string safety within each
// file, but that also makes their literal values part of the type — this
// widens every leaf string back to `string` so `en` (different literals,
// same shape) satisfies the same `Dictionary` type as `fr`.
type Widen<T> = T extends string
  ? string
  : T extends (...args: infer A) => infer R
    ? (...args: A) => Widen<R>
    : T extends readonly (infer U)[]
      ? readonly Widen<U>[]
      : T extends object
        ? { [K in keyof T]: Widen<T[K]> }
        : T;

export type Dictionary = Widen<typeof fr>;

const DICTIONARIES: Record<Locale, Dictionary> = { fr, en };
const COOKIE_NAME = "acte-locale";

const LocaleContext = createContext<{ locale: Locale; t: Dictionary; setLocale: (l: Locale) => void } | null>(null);

function persistLocale(locale: Locale) {
  try {
    document.cookie = `${COOKIE_NAME}=${locale}; path=/; max-age=31536000; samesite=lax`;
  } catch {
    // cookies unavailable (very old browser / restricted context) — the
    // toggle still works for the rest of this session, it just won't
    // survive a reload.
  }
}

/**
 * `initialLocale` comes from the server (Accept-Language header on first
 * visit, or the `acte-locale` cookie once the user has switched once — see
 * apps/web/src/lib/locale-server.ts) so there is no flash of the wrong
 * language on first paint.
 */
export function LocaleProvider({ initialLocale, children }: { initialLocale: Locale; children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(initialLocale);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    persistLocale(next);
  }, []);

  const value = useMemo(() => ({ locale, t: DICTIONARIES[locale], setLocale }), [locale, setLocale]);

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(LocaleContext);
  if (!ctx) throw new Error("useI18n() must be used within a LocaleProvider");
  return ctx;
}
