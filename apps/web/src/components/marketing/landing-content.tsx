"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/locale-context";
import { LandingNavbar } from "@/components/marketing/navbar";
import { LandingFooter } from "@/components/marketing/footer";

export function LandingContent() {
  const { t } = useI18n();
  const landing = t.landing;

  return (
    <div className="scroll-thin relative z-10 h-[100dvh] overflow-y-auto overflow-x-hidden">
      <LandingNavbar />

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-16 sm:px-6 sm:pt-24 lg:grid-cols-2 lg:items-center lg:pt-28">
          <div className="fade-up">
            <p className="eyebrow">{landing.hero.eyebrow}</p>
            <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-ivory sm:text-[44px] lg:text-[50px]">
              {landing.hero.title}
            </h1>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ash">{landing.hero.subtitle}</p>
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-6 py-3 text-[13.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
              >
                {landing.hero.ctaPrimary}
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/[0.12] px-6 py-3 text-[13.5px] text-ivory/85 transition hover:border-gold/35 hover:text-gold-pale"
              >
                {landing.hero.ctaSecondary}
              </Link>
            </div>
          </div>

          <div className="fade-up">
            <DashboardPreview />
          </div>
        </section>

        {/* Audience strip */}
        <section className="border-y border-white/[0.06] bg-white/[0.015] py-8">
          <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-10 gap-y-3 px-4 sm:px-6">
            <span className="eyebrow shrink-0">{landing.audience.title}</span>
            {landing.audience.items.map((item) => (
              <span key={item} className="text-[13px] text-ash">
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* Features */}
        <section id="fonctionnalites" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-[56ch]">
            <p className="eyebrow">{landing.features.eyebrow}</p>
            <h2 className="mt-3 font-display text-[26px] font-bold leading-tight text-ivory sm:text-[30px]">
              {landing.features.title}
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {landing.features.items.map((item) => (
              <div key={item.title} className="glass fade-up p-5">
                <h3 className="font-display text-[15px] font-semibold text-ivory">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ash">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* How it works */}
        <section id="comment-ca-marche" className="border-t border-white/[0.06] bg-white/[0.015] py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-[56ch]">
              <p className="eyebrow">{landing.howItWorks.eyebrow}</p>
              <h2 className="mt-3 font-display text-[26px] font-bold leading-tight text-ivory sm:text-[30px]">
                {landing.howItWorks.title}
              </h2>
            </div>
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {landing.howItWorks.steps.map((step, i) => (
                <div key={step.title} className="fade-up">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[10px] border border-gold/40 bg-gradient-to-br from-gold-pale/20 to-gold-deep/20 font-display text-[14px] font-semibold text-gold-pale">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 font-display text-[14.5px] font-semibold text-ivory">{step.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ash">{step.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Security */}
        <section id="securite" className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="max-w-[56ch]">
            <p className="eyebrow">{landing.security.eyebrow}</p>
            <h2 className="mt-3 font-display text-[26px] font-bold leading-tight text-ivory sm:text-[30px]">
              {landing.security.title}
            </h2>
          </div>
          <div className="mt-10 grid gap-4 sm:grid-cols-3">
            {landing.security.items.map((item) => (
              <div key={item.title} className="glass-soft fade-up rounded-2xl p-5">
                <h3 className="font-display text-[14.5px] font-semibold text-ivory">{item.title}</h3>
                <p className="mt-2 text-[13px] leading-relaxed text-ash">{item.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section className="border-t border-white/[0.06] bg-white/[0.015] py-20">
          <div className="glass fade-up mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-12 text-center sm:px-10">
            <h2 className="font-display text-[24px] font-bold leading-tight text-ivory sm:text-[28px]">
              {landing.ctaBanner.title}
            </h2>
            <p className="max-w-[42ch] text-[14px] text-ash">{landing.ctaBanner.subtitle}</p>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-7 py-3 text-[13.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
            >
              {landing.ctaBanner.cta}
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}

function DashboardPreview() {
  const { t } = useI18n();
  const hero = t.landing.hero;
  return (
    <div className="glass p-5 sm:p-6">
      <p className="text-[11px] uppercase tracking-[0.08em] text-ash">{hero.previewCaption}</p>
      <div className="mt-4 grid gap-3 sm:grid-cols-3">
        <div className="glass-soft rounded-2xl p-4">
          <p className="text-[11px] text-ash">{hero.previewCaptured}</p>
          <p className="mt-1.5 font-display text-[22px] font-bold text-ivory">6h20</p>
        </div>
        <div className="glass-soft rounded-2xl p-4">
          <p className="text-[11px] text-ash">3h10 {hero.previewValidated}</p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full w-1/2 rounded-full bg-gradient-to-r from-gold to-gold-deep" />
          </div>
        </div>
        <div className="glass-soft rounded-2xl p-4">
          <p className="text-[11px] text-ash">3h10 {hero.previewPending}</p>
          <div className="mt-2.5 h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]">
            <div className="h-full w-1/2 rounded-full bg-white/25" />
          </div>
        </div>
      </div>
      <div className="mt-3 space-y-2">
        {hero.previewRows.map((row) => (
          <div key={row.label} className="task-row flex items-center justify-between rounded-xl px-3 py-2.5">
            <span className="truncate text-[12.5px] text-ivory/85">{row.label}</span>
            <span className="ml-3 shrink-0 rounded-full border border-white/[0.1] px-2 py-0.5 text-[10.5px] text-ash">
              {row.confidence}%
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
