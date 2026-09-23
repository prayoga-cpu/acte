"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/locale-context";
import { Logo } from "@/components/marketing/logo";

export function LandingFooter() {
  const { t } = useI18n();
  const nav = t.landing.nav;
  const footer = t.landing.footer;
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-white/[0.06] py-14">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-[1.2fr_1fr_1fr_1fr]">
          <div>
            <Logo className="text-[18px]" />
            <p className="mt-3 max-w-[32ch] text-[12.5px] leading-relaxed text-ash">{footer.tagline}</p>
          </div>

          <div>
            <p className="eyebrow">{footer.productTitle}</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/overview" className="text-[13px] text-ash transition hover:text-ivory">
                  {nav.overview}
                </Link>
              </li>
              <li>
                <Link href="/#fonctionnalites" className="text-[13px] text-ash transition hover:text-ivory">
                  {nav.features}
                </Link>
              </li>
              <li>
                <Link href="/#securite" className="text-[13px] text-ash transition hover:text-ivory">
                  {nav.security}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">{footer.resourcesTitle}</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/guides" className="text-[13px] text-ash transition hover:text-ivory">
                  {nav.guides}
                </Link>
              </li>
              <li>
                <Link href="/blog" className="text-[13px] text-ash transition hover:text-ivory">
                  {footer.blog}
                </Link>
              </li>
              <li>
                <Link href="/about" className="text-[13px] text-ash transition hover:text-ivory">
                  {footer.about}
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className="eyebrow">{footer.accountTitle}</p>
            <ul className="mt-3 space-y-2">
              <li>
                <Link href="/login" className="text-[13px] text-ash transition hover:text-ivory">
                  {nav.login}
                </Link>
              </li>
              <li>
                <Link href="/signup" className="text-[13px] text-ash transition hover:text-ivory">
                  {nav.cta}
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-white/[0.06] pt-6 text-[12px] text-ash sm:flex-row sm:items-center sm:justify-between">
          <span>
            © {year} ACTE. {footer.rights}
          </span>
          <span className="flex gap-4">
            <Link href="/terms" className="transition hover:text-ivory">
              {footer.terms}
            </Link>
            <Link href="/privacy" className="transition hover:text-ivory">
              {footer.privacy}
            </Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
