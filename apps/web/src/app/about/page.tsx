"use client";

import Link from "next/link";
import { LandingNavbar } from "@/components/marketing/navbar";
import { LandingFooter } from "@/components/marketing/footer";
import { useI18n } from "@/i18n/locale-context";

export default function AboutPage() {
  const { t } = useI18n();
  const p = t.about;

  return (
    <div className="scroll-thin relative z-10 h-[100dvh] overflow-y-auto overflow-x-hidden">
      <LandingNavbar />

      <main>
        {/* Mission */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="fade-up max-w-[62ch]">
            <p className="eyebrow">{p.mission.eyebrow}</p>
            <h1 className="mt-4 font-display text-[32px] font-extrabold leading-[1.12] tracking-tight text-ivory sm:text-[40px]">
              {p.mission.title}
            </h1>
            <p className="mt-5 text-[14.5px] leading-relaxed text-ash">{p.mission.paragraph1}</p>
            <p className="mt-4 text-[14.5px] leading-relaxed text-ash">{p.mission.paragraph2}</p>
          </div>
        </section>

        {/* Notre approche */}
        <section className="border-t border-white/[0.06] bg-white/[0.015] py-20">
          <div className="mx-auto max-w-6xl px-4 sm:px-6">
            <div className="max-w-[56ch]">
              <p className="eyebrow">{p.approach.eyebrow}</p>
              <h2 className="mt-3 font-display text-[26px] font-bold leading-tight text-ivory sm:text-[30px]">
                {p.approach.title}
              </h2>
            </div>
            <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {p.approach.principles.map((principle) => (
                <div key={principle.title} className="glass-soft fade-up rounded-2xl p-5">
                  <h3 className="font-display text-[14.5px] font-semibold text-ivory">{principle.title}</h3>
                  <p className="mt-2 text-[13px] leading-relaxed text-ash">{principle.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Conçu et développé en France */}
        <section className="mx-auto max-w-6xl px-4 py-20 sm:px-6">
          <div className="glass fade-up p-6 sm:p-8">
            <div className="max-w-[56ch]">
              <p className="eyebrow">{p.france.eyebrow}</p>
              <h2 className="mt-3 font-display text-[20px] font-semibold text-ivory">{p.france.title}</h2>
              <p className="mt-2.5 text-[13.5px] leading-relaxed text-ash">{p.france.body}</p>
            </div>
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
