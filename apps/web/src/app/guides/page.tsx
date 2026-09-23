"use client";

import Link from "next/link";
import { LandingNavbar } from "@/components/marketing/navbar";
import { LandingFooter } from "@/components/marketing/footer";
import { useI18n } from "@/i18n/locale-context";

export default function GuidesPage() {
  const { t } = useI18n();
  const p = t.guides;

  return (
    <div className="scroll-thin relative z-10 h-[100dvh] overflow-y-auto overflow-x-hidden">
      <LandingNavbar />

      <main>
        {/* Intro */}
        <section className="mx-auto max-w-6xl px-4 pb-4 pt-16 sm:px-6 sm:pt-24">
          <div className="fade-up max-w-[56ch]">
            <p className="eyebrow">{p.eyebrow}</p>
            <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-ivory sm:text-[44px]">
              {p.title}
            </h1>
            <p className="mt-5 max-w-[52ch] text-[15px] leading-relaxed text-ash">{p.subtitle}</p>
          </div>
        </section>

        {/* Guide cards */}
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {p.items.map((guide, i) => (
              <div key={guide.title} className="glass fade-up p-6">
                <div className="flex h-8 w-8 items-center justify-center rounded-[10px] border border-gold/40 bg-gradient-to-br from-gold-pale/20 to-gold-deep/20 font-display text-[13px] font-semibold text-gold-pale">
                  {i + 1}
                </div>
                <h2 className="mt-4 font-display text-[15px] font-semibold text-ivory">{guide.title}</h2>
                <p className="mt-2 text-[13px] leading-relaxed text-ash">{guide.body}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section className="border-t border-white/[0.06] bg-white/[0.015] py-20">
          <div className="glass fade-up mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-12 text-center sm:px-10">
            <h2 className="font-display text-[24px] font-bold leading-tight text-ivory sm:text-[28px]">
              {p.cta.title}
            </h2>
            <p className="max-w-[42ch] text-[14px] text-ash">{p.cta.subtitle}</p>
            <Link
              href="/signup"
              className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-7 py-3 text-[13.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
            >
              {p.cta.button}
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
