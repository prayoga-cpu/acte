"use client";

import Link from "next/link";
import { LandingNavbar } from "@/components/marketing/navbar";
import { LandingFooter } from "@/components/marketing/footer";
import { useI18n } from "@/i18n/locale-context";

function PlaceholderText({ text }: { text: string }) {
  return <span className="text-ash/70">{text}</span>;
}

export default function TermsPage() {
  const { t } = useI18n();
  const p = t.terms;

  const SECTIONS: { title: string; body: React.ReactNode }[] = [
    {
      title: p.s1.title,
      body: (
        <p>
          {p.s1.bodyPre} <PlaceholderText text={p.s1.companyPlaceholder} />
          {p.s1.bodyPost}
        </p>
      ),
    },
    {
      title: p.s2.title,
      body: <p>{p.s2.body}</p>,
    },
    {
      title: p.s3.title,
      body: <p>{p.s3.body}</p>,
    },
    {
      title: p.s4.title,
      body: (
        <>
          <p>{p.s4.paragraph1}</p>
          <p>{p.s4.paragraph2}</p>
        </>
      ),
    },
    {
      title: p.s5.title,
      body: <p>{p.s5.body}</p>,
    },
    {
      title: p.s6.title,
      body: <p>{p.s6.body}</p>,
    },
    {
      title: p.s7.title,
      body: <p>{p.s7.body}</p>,
    },
    {
      title: p.s8.title,
      body: (
        <p>
          {p.s8.bodyPre}{" "}
          <Link href="/privacy" className="text-ivory underline decoration-white/30 underline-offset-2 hover:text-gold-pale">
            {p.s8.linkText}
          </Link>
          {p.s8.bodyPost}
        </p>
      ),
    },
    {
      title: p.s9.title,
      body: <p>{p.s9.body}</p>,
    },
    {
      title: p.s10.title,
      body: <p>{p.s10.body}</p>,
    },
    {
      title: p.s11.title,
      body: <p>{p.s11.body}</p>,
    },
    {
      title: p.s12.title,
      body: <p>{p.s12.body}</p>,
    },
    {
      title: p.s13.title,
      body: (
        <div className="space-y-1.5">
          <p>
            <PlaceholderText text={p.s13.companyPlaceholder} /> · <PlaceholderText text={p.s13.siretPlaceholder} /> ·{" "}
            <PlaceholderText text={p.s13.addressPlaceholder} />
          </p>
          <p>
            {p.s13.directorLabel} <PlaceholderText text={p.s13.directorPlaceholder} />
          </p>
          <p>{p.s13.hostingLabel}</p>
          <p>
            {p.s13.contactLabel} <PlaceholderText text={p.s13.contactPlaceholder} />
          </p>
        </div>
      ),
    },
  ];

  return (
    <div className="scroll-thin relative z-10 h-[100dvh] overflow-y-auto overflow-x-hidden">
      <LandingNavbar />
      <main className="mx-auto max-w-3xl px-4 py-16 sm:px-6 sm:py-20">
        <p className="eyebrow">{p.eyebrow}</p>
        <h1 className="mt-3 font-display text-[28px] font-extrabold leading-tight text-ivory sm:text-[32px]">
          {p.title}
        </h1>
        <p className="mt-3 text-[12.5px] text-ash">{p.lastUpdated}</p>

        <div className="mt-10 space-y-8">
          {SECTIONS.map((section) => (
            <section key={section.title}>
              <h2 className="font-display text-[16px] font-semibold text-ivory">{section.title}</h2>
              <div className="mt-2.5 space-y-2.5 text-[13.5px] leading-relaxed text-ash">{section.body}</div>
            </section>
          ))}
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
