"use client";

import { useState } from "react";
import Link from "next/link";
import { useI18n } from "@/i18n/locale-context";
import { Logo } from "@/components/marketing/logo";
import { LocaleToggleButton } from "@/components/locale-toggle-button";

export function LandingNavbar() {
  const [open, setOpen] = useState(false);
  const { t } = useI18n();
  const nav = t.landing.nav;

  const LINKS = [
    { href: "/overview", label: nav.overview },
    { href: "/#fonctionnalites", label: nav.features },
    { href: "/#securite", label: nav.security },
    { href: "/guides", label: nav.guides },
  ];

  return (
    <header className="sticky top-0 z-20 border-b border-white/[0.06] bg-black/40 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-7 sm:flex">
          {LINKS.map((link) => (
            <Link key={link.href} href={link.href} className="text-[13px] text-ash transition hover:text-ivory">
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 sm:flex">
          <LocaleToggleButton />
          <Link href="/login" className="text-[13px] text-ivory/85 transition hover:text-gold-pale">
            {nav.login}
          </Link>
          <Link
            href="/signup"
            className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-2 text-[12.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
          >
            {nav.cta}
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:hidden">
          <LocaleToggleButton />
          <button
            type="button"
            aria-label="Menu"
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/[0.1] text-ivory"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
              {open ? <path d="M18 6 6 18M6 6l12 12" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-white/[0.06] px-4 pb-5 pt-2 sm:hidden">
          <div className="flex flex-col gap-1">
            {LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-lg px-2 py-2.5 text-[13.5px] text-ash transition hover:bg-white/[0.04] hover:text-ivory"
              >
                {link.label}
              </Link>
            ))}
          </div>
          <div className="mt-3 flex flex-col gap-2 border-t border-white/[0.06] pt-3">
            <Link
              href="/login"
              className="rounded-full border border-white/[0.12] px-4 py-2.5 text-center text-[13px] text-ivory/85"
            >
              {nav.login}
            </Link>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-4 py-2.5 text-center text-[13px] font-semibold text-noir"
            >
              {nav.cta}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
