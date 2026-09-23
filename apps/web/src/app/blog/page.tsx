"use client";

import Link from "next/link";
import { useI18n } from "@/i18n/locale-context";
import { LandingNavbar } from "@/components/marketing/navbar";
import { LandingFooter } from "@/components/marketing/footer";

export default function BlogPage() {
  const { t } = useI18n();
  const p = t.blog;

  return (
    <div className="scroll-thin relative z-10 h-[100dvh] overflow-y-auto overflow-x-hidden">
      <LandingNavbar />

      <main>
        {/* Intro */}
        <section className="mx-auto max-w-6xl px-4 pb-16 pt-16 sm:px-6 sm:pt-24">
          <div className="fade-up max-w-[56ch]">
            <p className="eyebrow">{p.eyebrow}</p>
            <h1 className="mt-4 font-display text-[34px] font-extrabold leading-[1.08] tracking-tight text-ivory sm:text-[44px]">
              {p.title}
            </h1>
            <p className="mt-5 max-w-[46ch] text-[15px] leading-relaxed text-ash">{p.subtitle}</p>
          </div>
        </section>

        {/* Articles */}
        <section className="border-t border-white/[0.06] bg-white/[0.015] py-20">
          <div className="mx-auto max-w-3xl space-y-6 px-4 sm:px-6">
            {p.articles.map((article, idx) => (
              <article key={idx} className="glass fade-up p-6 sm:p-8">
                <p className="text-[11.5px] uppercase tracking-[0.08em] text-ash">
                  {p.dateline} · {p.byline}
                </p>
                <h2 className="mt-3 font-display text-[20px] font-bold leading-tight text-ivory sm:text-[22px]">
                  {article.title}
                </h2>
                <div className="mt-4 space-y-3 text-[13.5px] leading-relaxed text-ash">
                  {article.paragraphs.map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                  {"closingPre" in article ? (
                    <p>
                      {article.closingPre}{" "}
                      <Link
                        href="/privacy"
                        className="text-ivory underline decoration-white/30 underline-offset-2 hover:text-gold-pale"
                      >
                        {article.closingLinkText}
                      </Link>
                      .
                    </p>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </section>

        {/* CTA banner */}
        <section className="py-20">
          <div className="glass fade-up mx-auto flex max-w-4xl flex-col items-center gap-6 px-6 py-12 text-center sm:px-10">
            <h2 className="font-display text-[24px] font-bold leading-tight text-ivory sm:text-[28px]">
              {p.cta.title}
            </h2>
            <p className="max-w-[42ch] text-[14px] text-ash">{p.cta.subtitle}</p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/signup"
                className="rounded-full bg-gradient-to-r from-gold to-gold-deep px-7 py-3 text-[13.5px] font-semibold text-noir transition hover:brightness-110 active:scale-[0.98]"
              >
                {p.cta.primary}
              </Link>
              <Link
                href="/login"
                className="rounded-full border border-white/[0.12] px-7 py-3 text-[13.5px] text-ivory/85 transition hover:border-gold/35 hover:text-gold-pale"
              >
                {p.cta.secondary}
              </Link>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
