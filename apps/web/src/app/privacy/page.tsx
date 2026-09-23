"use client";

import { LandingNavbar } from "@/components/marketing/navbar";
import { LandingFooter } from "@/components/marketing/footer";
import { useI18n } from "@/i18n/locale-context";

export default function PrivacyPage() {
  const { t } = useI18n();
  const p = t.privacy;

  return (
    <div className="scroll-thin relative z-10 h-[100dvh] overflow-y-auto overflow-x-hidden">
      <LandingNavbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="eyebrow">{p.eyebrow}</p>
        <h1 className="mt-3 font-display text-[28px] font-extrabold leading-tight text-ivory sm:text-[32px]">
          {p.title}
        </h1>
        <p className="mt-3 text-[12.5px] text-ash">{p.lastUpdated}</p>

        <div className="mt-10 space-y-10">
          <section>
            <h2 className="font-display text-[16px] font-semibold text-ivory">{p.s1.title}</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ash">
              {p.s1.bodyPre}{" "}
              <a href="/terms" className="text-ivory underline decoration-white/30 underline-offset-2 hover:text-gold-pale">
                {p.s1.linkText}
              </a>
              {p.s1.bodyPost}
            </p>
          </section>

          <section>
            <h2 className="font-display text-[16px] font-semibold text-ivory">{p.s2.title}</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ash">{p.s2.intro}</p>
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              {p.s2.classes.map((c) => (
                <div key={c.title} className="glass-soft rounded-2xl p-4">
                  <h3 className="font-display text-[13.5px] font-semibold text-ivory">{c.title}</h3>
                  <p className="mt-1.5 text-[12.5px] leading-relaxed text-ash">{c.body}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h2 className="font-display text-[16px] font-semibold text-ivory">{p.s3.title}</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ash">{p.s3.body}</p>
          </section>

          <section>
            <h2 className="font-display text-[16px] font-semibold text-ivory">{p.s4.title}</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ash">{p.s4.intro}</p>
            <ul className="mt-3 space-y-2">
              {p.s4.recipients.map((r) => (
                <li key={r.name} className="text-[13.5px] leading-relaxed text-ash">
                  <span className="font-medium text-ivory">{r.name}</span> — {r.role}
                </li>
              ))}
            </ul>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ash">{p.s4.outro}</p>
          </section>

          <section>
            <h2 className="font-display text-[16px] font-semibold text-ivory">{p.s5.title}</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ash">{p.s5.body}</p>
          </section>

          <section>
            <h2 className="font-display text-[16px] font-semibold text-ivory">{p.s6.title}</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ash">{p.s6.body}</p>
          </section>

          <section>
            <h2 className="font-display text-[16px] font-semibold text-ivory">{p.s7.title}</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ash">{p.s7.body}</p>
          </section>

          <section>
            <h2 className="font-display text-[16px] font-semibold text-ivory">{p.s8.title}</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ash">{p.s8.body}</p>
          </section>

          <section>
            <h2 className="font-display text-[16px] font-semibold text-ivory">{p.s9.title}</h2>
            <ul className="mt-2.5 list-inside list-disc space-y-1.5 text-[13.5px] leading-relaxed text-ash">
              {p.s9.rights.map((r) => (
                <li key={r}>{r}</li>
              ))}
            </ul>
            <p className="mt-3 text-[13.5px] leading-relaxed text-ash">
              {p.s9.contactPre} <span className="text-ash/70">{p.s9.contactPlaceholder}</span>
              {p.s9.contactPost}
            </p>
          </section>

          <section>
            <h2 className="font-display text-[16px] font-semibold text-ivory">{p.s10.title}</h2>
            <p className="mt-2.5 text-[13.5px] leading-relaxed text-ash">{p.s10.body}</p>
          </section>
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
